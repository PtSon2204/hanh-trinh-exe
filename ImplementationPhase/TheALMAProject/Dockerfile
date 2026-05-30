# Giai đoạn 1: Build source code
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy các file .csproj vào đúng cấu trúc thư mục để restore (giúp tối ưu cache)
COPY ["TheALMAProject.API/TheALMAProject.API.csproj", "TheALMAProject.API/"]
COPY ["TheALMAProject.Application/TheALMAProject.Application.csproj", "TheALMAProject.Application/"]
COPY ["TheALMAProject.Domain/TheALMAProject.Domain.csproj", "TheALMAProject.Domain/"]
COPY ["TheALMAProject.Infrastructure/TheALMAProject.Infrastructure.csproj", "TheALMAProject.Infrastructure/"]

# Chạy lệnh restore các thư viện cho project API (các project khác cũng sẽ được restore theo)
RUN dotnet restore "TheALMAProject.API/TheALMAProject.API.csproj"

# Copy toàn bộ source code còn lại vào container
COPY . .
WORKDIR "/src/TheALMAProject.API"

# Build và đóng gói (publish) file chạy ra thư mục /app/publish
RUN dotnet publish "TheALMAProject.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Giai đoạn 2: Tạo môi trường Runtime để chạy app cho nhẹ
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Lấy các file đã đóng gói ở giai đoạn 1 sang giai đoạn 2
COPY --from=build /app/publish .

# Lệnh khởi chạy server
ENTRYPOINT ["dotnet", "TheALMAProject.API.dll"]