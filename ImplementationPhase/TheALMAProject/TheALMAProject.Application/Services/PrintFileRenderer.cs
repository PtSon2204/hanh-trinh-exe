using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class PrintFileRenderer : IPrintFileRenderer
    {
        private const int PrintWidth = 1200;
        private const int PrintHeight = 1800;
        private const int PixelsPerMeterFor300Dpi = 11811;
        private const int MaxCanvasJsonBytes = 256 * 1024;
        private const int MaxCanvasObjectCount = 500;
        private const int MaxCanvasJsonDepth = 32;

        public byte[] GenerateOrderItemPrintPng(Order order, OrderItem item, UserDesign design)
        {
            var frontCanvasJson = GetFrontCanvasJson(design);
            var pixels = Enumerable.Repeat((byte)255, PrintWidth * PrintHeight * 3).ToArray();

            DrawRect(pixels, 36, 36, PrintWidth - 72, PrintHeight - 72, 245, 245, 245);
            DrawRect(pixels, 72, 72, PrintWidth - 144, PrintHeight - 144, 255, 255, 255);
            DrawRect(pixels, 72, 72, PrintWidth - 144, 8, 20, 20, 20);
            DrawRect(pixels, 72, PrintHeight - 80, PrintWidth - 144, 8, 20, 20, 20);

            DrawCanvasObjects(pixels, frontCanvasJson);
            DrawFingerprint(pixels, $"{order.OrderCode}|{item.OrderItemId}|{design.DesignId}|{frontCanvasJson}");

            return CreatePng(pixels);
        }

        public byte[] GenerateOrderItemPlacementGuidePng(Order order, OrderItem item, UserDesign design)
        {
            var frontCanvasJson = GetFrontCanvasJson(design);
            var pixels = Enumerable.Repeat((byte)248, PrintWidth * PrintHeight * 3).ToArray();

            DrawRect(pixels, 0, 0, PrintWidth, PrintHeight, 248, 250, 252);
            DrawRect(pixels, 252, 150, 696, 96, 229, 231, 235);
            DrawRect(pixels, 324, 246, 552, 1170, 255, 255, 255);
            DrawRect(pixels, 224, 312, 100, 560, 255, 255, 255);
            DrawRect(pixels, 876, 312, 100, 560, 255, 255, 255);
            DrawRect(pixels, 466, 150, 268, 126, 248, 250, 252);

            DrawRect(pixels, 360, 430, 480, 720, 244, 247, 251);
            DrawBorder(pixels, 360, 430, 480, 720, 30, 64, 175);
            DrawCenterLines(pixels, 360, 430, 480, 720);
            DrawCanvasObjects(pixels, frontCanvasJson);
            DrawFingerprint(pixels, $"GUIDE|{order.OrderCode}|{item.OrderItemId}|{item.Size}|{item.Quantity}|{design.DesignId}");

            return CreatePng(pixels);
        }

        private static string GetFrontCanvasJson(UserDesign design)
        {
            return string.IsNullOrWhiteSpace(design.FrontCanvasJson)
                ? design.CanvasJson
                : design.FrontCanvasJson;
        }

        private static void DrawCanvasObjects(byte[] pixels, string canvasJson)
        {
            if (Encoding.UTF8.GetByteCount(canvasJson) > MaxCanvasJsonBytes)
            {
                throw new InvalidOperationException("Canvas JSON is too large to render safely.");
            }

            try
            {
                using var document = JsonDocument.Parse(canvasJson, new JsonDocumentOptions
                {
                    MaxDepth = MaxCanvasJsonDepth
                });
                if (!document.RootElement.TryGetProperty("objects", out var objects) || objects.ValueKind != JsonValueKind.Array)
                {
                    return;
                }

                var objectCount = 0;
                foreach (var obj in objects.EnumerateArray())
                {
                    objectCount++;
                    if (objectCount > MaxCanvasObjectCount)
                    {
                        throw new InvalidOperationException("Canvas JSON contains too many objects to render safely.");
                    }

                    var left = ReadInt(obj, "left", 160);
                    var top = ReadInt(obj, "top", 220);
                    var objectWidth = ReadInt(obj, "width", 220);
                    var objectHeight = ReadInt(obj, "height", 120);
                    var color = ReadColor(obj, "fill");

                    DrawRect(
                        pixels,
                        Math.Clamp(left + 120, 100, PrintWidth - 160),
                        Math.Clamp(top + 180, 120, PrintHeight - 180),
                        Math.Clamp(objectWidth, 40, PrintWidth - 240),
                        Math.Clamp(objectHeight, 24, PrintHeight - 300),
                        color.R,
                        color.G,
                        color.B);
                }
            }
            catch (JsonException)
            {
                DrawFingerprint(pixels, canvasJson);
            }
        }

        private static int ReadInt(JsonElement element, string propertyName, int fallback)
        {
            if (!element.TryGetProperty(propertyName, out var property))
            {
                return fallback;
            }

            return property.ValueKind switch
            {
                JsonValueKind.Number when property.TryGetInt32(out var intValue) => intValue,
                JsonValueKind.Number => (int)property.GetDouble(),
                _ => fallback
            };
        }

        private static (byte R, byte G, byte B) ReadColor(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.String)
            {
                return (40, 40, 40);
            }

            var value = property.GetString();
            if (string.IsNullOrWhiteSpace(value) || !value.StartsWith('#') || value.Length != 7)
            {
                return (40, 40, 40);
            }

            return (
                Convert.ToByte(value.Substring(1, 2), 16),
                Convert.ToByte(value.Substring(3, 2), 16),
                Convert.ToByte(value.Substring(5, 2), 16));
        }

        private static void DrawFingerprint(byte[] pixels, string value)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
            for (var i = 0; i < hash.Length; i++)
            {
                var x = 120 + i * 28;
                var height = 40 + hash[i] % 180;
                DrawRect(pixels, x, PrintHeight - 340 - height, 18, height, hash[i], (byte)(255 - hash[i]), (byte)(hash[i] / 2));
            }
        }

        private static void DrawBorder(byte[] pixels, int x, int y, int width, int height, byte r, byte g, byte b)
        {
            DrawRect(pixels, x, y, width, 8, r, g, b);
            DrawRect(pixels, x, y + height - 8, width, 8, r, g, b);
            DrawRect(pixels, x, y, 8, height, r, g, b);
            DrawRect(pixels, x + width - 8, y, 8, height, r, g, b);
        }

        private static void DrawCenterLines(byte[] pixels, int x, int y, int width, int height)
        {
            var centerX = x + width / 2;
            var centerY = y + height / 2;

            for (var py = y; py < y + height; py += 28)
            {
                DrawRect(pixels, centerX - 2, py, 4, 14, 59, 130, 246);
            }

            for (var px = x; px < x + width; px += 28)
            {
                DrawRect(pixels, px, centerY - 2, 14, 4, 59, 130, 246);
            }
        }

        private static void DrawRect(byte[] pixels, int x, int y, int rectWidth, int rectHeight, byte r, byte g, byte b)
        {
            var startX = Math.Clamp(x, 0, PrintWidth - 1);
            var startY = Math.Clamp(y, 0, PrintHeight - 1);
            var endX = Math.Clamp(x + rectWidth, 0, PrintWidth);
            var endY = Math.Clamp(y + rectHeight, 0, PrintHeight);

            for (var py = startY; py < endY; py++)
            {
                for (var px = startX; px < endX; px++)
                {
                    var index = (py * PrintWidth + px) * 3;
                    pixels[index] = r;
                    pixels[index + 1] = g;
                    pixels[index + 2] = b;
                }
            }
        }

        private static byte[] CreatePng(byte[] rgbPixels)
        {
            using var output = new MemoryStream();
            output.Write(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 });

            using (var ihdr = new MemoryStream())
            {
                WriteInt(ihdr, PrintWidth);
                WriteInt(ihdr, PrintHeight);
                ihdr.WriteByte(8);
                ihdr.WriteByte(2);
                ihdr.WriteByte(0);
                ihdr.WriteByte(0);
                ihdr.WriteByte(0);
                WriteChunk(output, "IHDR", ihdr.ToArray());
            }

            using (var phys = new MemoryStream())
            {
                WriteInt(phys, PixelsPerMeterFor300Dpi);
                WriteInt(phys, PixelsPerMeterFor300Dpi);
                phys.WriteByte(1);
                WriteChunk(output, "pHYs", phys.ToArray());
            }

            using (var raw = new MemoryStream())
            {
                var stride = PrintWidth * 3;
                for (var y = 0; y < PrintHeight; y++)
                {
                    raw.WriteByte(0);
                    raw.Write(rgbPixels, y * stride, stride);
                }

                using var compressed = new MemoryStream();
                using (var zlib = new ZLibStream(compressed, CompressionLevel.Fastest, leaveOpen: true))
                {
                    raw.Position = 0;
                    raw.CopyTo(zlib);
                }

                WriteChunk(output, "IDAT", compressed.ToArray());
            }

            WriteChunk(output, "IEND", Array.Empty<byte>());
            return output.ToArray();
        }

        private static void WriteChunk(Stream output, string type, byte[] data)
        {
            WriteInt(output, data.Length);
            var typeBytes = Encoding.ASCII.GetBytes(type);
            output.Write(typeBytes);
            output.Write(data);

            var crcData = new byte[typeBytes.Length + data.Length];
            Buffer.BlockCopy(typeBytes, 0, crcData, 0, typeBytes.Length);
            Buffer.BlockCopy(data, 0, crcData, typeBytes.Length, data.Length);
            WriteInt(output, unchecked((int)Crc32(crcData)));
        }

        private static void WriteInt(Stream stream, int value)
        {
            stream.WriteByte((byte)((value >> 24) & 255));
            stream.WriteByte((byte)((value >> 16) & 255));
            stream.WriteByte((byte)((value >> 8) & 255));
            stream.WriteByte((byte)(value & 255));
        }

        private static uint Crc32(byte[] bytes)
        {
            uint crc = 0xffffffff;
            foreach (var b in bytes)
            {
                crc ^= b;
                for (var i = 0; i < 8; i++)
                {
                    crc = (crc & 1) == 1 ? (crc >> 1) ^ 0xedb88320 : crc >> 1;
                }
            }

            return ~crc;
        }
    }
}
