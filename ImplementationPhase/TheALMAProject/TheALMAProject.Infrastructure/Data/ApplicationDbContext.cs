using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Address> Addresses { get; set; }

    public DbSet<BaseProduct> BaseProducts { get; set; }

    public DbSet<Cart> Carts { get; set; }

    public DbSet<CartItem> CartItems { get; set; }

    public DbSet<Font> Fonts { get; set; }

    public DbSet<Icon> Icons { get; set; }

    public DbSet<Notification> Notifications { get; set; }

    public DbSet<Order> Orders { get; set; }
           
    public DbSet<OrderItem> OrderItems { get; set; }
           
    public DbSet<Review> Reviews { get; set; }
           
    public DbSet<StoreProduct> StoreProducts { get; set; }
           
    public DbSet<University> Universities { get; set; }
           
    public DbSet<User> Users { get; set; }
           
    public DbSet<UserDesign> UserDesigns { get; set; }
           
    public DbSet<Voucher> Vouchers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("PK__Addresse__091C2AFB7B9DE846");

            entity.Property(e => e.AddressLine).HasMaxLength(500);
            entity.Property(e => e.District).HasMaxLength(100);
            entity.Property(e => e.FullName).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Province).HasMaxLength(100);

            entity.HasOne(d => d.User).WithMany(p => p.Addresses)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Addresses__UserI__5070F446");
        });

        modelBuilder.Entity<BaseProduct>(entity =>
        {
            entity.HasKey(e => e.BaseProductId).HasName("PK__BaseProd__E5B4EA0EBA335FD5");

            entity.Property(e => e.AvailableSizes).HasMaxLength(255);
            entity.Property(e => e.BackImageUrl).HasMaxLength(500);
            entity.Property(e => e.BasePrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.FrontImageUrl).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Material)
                .HasMaxLength(255)
                .HasDefaultValue("100% Premium Cotton");
            entity.Property(e => e.Name).HasMaxLength(255);
        });

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.CartId).HasName("PK__Carts__51BCD7B78C192E83");

            entity.HasIndex(e => e.UserId, "UQ__Carts__1788CC4D50BA6655").IsUnique();

            entity.HasOne(d => d.User).WithOne(p => p.Cart)
                .HasForeignKey<Cart>(d => d.UserId)
                .HasConstraintName("FK__Carts__UserId__75A278F5");
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.CartItemId).HasName("PK__CartItem__488B0B0AE6E6914D");

            entity.Property(e => e.Size).HasMaxLength(50);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Cart).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.CartId)
                .HasConstraintName("FK__CartItems__CartI__787EE5A0");

            entity.HasOne(d => d.Design).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.DesignId)
                .HasConstraintName("FK__CartItems__Desig__7A672E12");

            entity.HasOne(d => d.Product).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK__CartItems__Produ__797309D9");
        });

        modelBuilder.Entity<Font>(entity =>
        {
            entity.HasKey(e => e.FontId).HasName("PK__Fonts__AB540A67EFAF88A3");

            entity.Property(e => e.FontFileUrl).HasMaxLength(500);
            entity.Property(e => e.FontName).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PriceAddon).HasColumnType("decimal(18, 2)");
        });

        modelBuilder.Entity<Icon>(entity =>
        {
            entity.HasKey(e => e.IconId).HasName("PK__Icons__43C7AD0F9AD14BCC");

            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.PriceAddon).HasColumnType("decimal(18, 2)");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("PK__Notifica__20CF2E122FE1A626");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.Type).HasMaxLength(50);

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Notificat__UserI__18EBB532");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("PK__Orders__C3905BCF87BD348B");

            entity.HasIndex(e => e.OrderCode, "UQ__Orders__999B522995FB84E2").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OrderCode).HasMaxLength(50);
            entity.Property(e => e.OrderStatus).HasMaxLength(50);
            entity.Property(e => e.PaymentMethod).HasMaxLength(50);
            entity.Property(e => e.PaymentStatus).HasMaxLength(50);
            entity.Property(e => e.ShipAddress).HasMaxLength(500);
            entity.Property(e => e.ShipName).HasMaxLength(255);
            entity.Property(e => e.ShipPhone).HasMaxLength(20);
            entity.Property(e => e.ShipProvince).HasMaxLength(100);
            entity.Property(e => e.ShippingFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.User).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Orders__UserId__06CD04F7");

            entity.HasOne(d => d.Voucher).WithMany(p => p.Orders)
                .HasForeignKey(d => d.VoucherId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__Orders__VoucherI__07C12930");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.OrderItemId).HasName("PK__OrderIte__57ED0681914D53F7");

            entity.Property(e => e.Size).HasMaxLength(50);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Design).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.DesignId)
                .HasConstraintName("FK__OrderItem__Desig__0C85DE4D");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK__OrderItem__Order__0A9D95DB");

            entity.HasOne(d => d.Product).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK__OrderItem__Produ__0B91BA14");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.ReviewId).HasName("PK__Reviews__74BC79CE49280B66");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Order).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK__Reviews__OrderId__14270015");

            entity.HasOne(d => d.Product).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK__Reviews__Product__1332DBDC");

            entity.HasOne(d => d.User).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Reviews__UserId__123EB7A3");
        });

        modelBuilder.Entity<StoreProduct>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__StorePro__B40CC6CD1EACDD5B");

            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.BaseProduct).WithMany(p => p.StoreProducts)
                .HasForeignKey(d => d.BaseProductId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__StoreProd__BaseP__6383C8BA");

            entity.HasOne(d => d.University).WithMany(p => p.StoreProducts)
                .HasForeignKey(d => d.UniversityId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__StoreProd__Unive__6477ECF3");
        });

        modelBuilder.Entity<University>(entity =>
        {
            entity.HasKey(e => e.UniversityId).HasName("PK__Universi__9F19E1BC1E88BBC0");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LogoUrl).HasMaxLength(500);
            entity.Property(e => e.Name).HasMaxLength(255);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CC4C79E34DBD");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D10534F89B8ED1").IsUnique();

            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FullName).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Role)
                .HasMaxLength(50)
                .HasDefaultValue("Customer");
            entity.Property(e => e.OAuthProvider).HasMaxLength(50);
            entity.Property(e => e.OAuthId).HasMaxLength(255);
            entity.Property(e => e.RefreshToken).HasMaxLength(500);
            entity.Property(e => e.RefreshTokenExpiry).HasColumnType("datetime");
        });

        modelBuilder.Entity<UserDesign>(entity =>
        {
            entity.HasKey(e => e.DesignId).HasName("PK__UserDesi__32B8E15F1DE471B7");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DesignName).HasMaxLength(255);
            entity.Property(e => e.PreviewImageUrl).HasMaxLength(500);
            entity.Property(e => e.PrintFileUrl).HasMaxLength(500);

            entity.HasOne(d => d.BaseProduct).WithMany(p => p.UserDesigns)
                .HasForeignKey(d => d.BaseProductId)
                .HasConstraintName("FK__UserDesig__BaseP__6A30C649");

            entity.HasOne(d => d.User).WithMany(p => p.UserDesigns)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__UserDesig__UserI__693CA210");

            entity.HasMany(d => d.Fonts).WithMany(p => p.Designs)
                .UsingEntity<Dictionary<string, object>>(
                    "DesignFont",
                    r => r.HasOne<Font>().WithMany()
                        .HasForeignKey("FontId")
                        .HasConstraintName("FK__DesignFon__FontI__71D1E811"),
                    l => l.HasOne<UserDesign>().WithMany()
                        .HasForeignKey("DesignId")
                        .HasConstraintName("FK__DesignFon__Desig__70DDC3D8"),
                    j =>
                    {
                        j.HasKey("DesignId", "FontId").HasName("PK__DesignFo__580DA1F90DFAC627");
                        j.ToTable("DesignFonts");
                    });

            entity.HasMany(d => d.Icons).WithMany(p => p.Designs)
                .UsingEntity<Dictionary<string, object>>(
                    "DesignIcon",
                    r => r.HasOne<Icon>().WithMany()
                        .HasForeignKey("IconId")
                        .HasConstraintName("FK__DesignIco__IconI__6E01572D"),
                    l => l.HasOne<UserDesign>().WithMany()
                        .HasForeignKey("DesignId")
                        .HasConstraintName("FK__DesignIco__Desig__6D0D32F4"),
                    j =>
                    {
                        j.HasKey("DesignId", "IconId").HasName("PK__DesignIc__D6849B8F86125734");
                        j.ToTable("DesignIcons");
                    });
        });

        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.HasKey(e => e.VoucherId).HasName("PK__Vouchers__3AEE7921945095BE");

            entity.HasIndex(e => e.Code, "UQ__Vouchers__A25C5AA7335BAA10").IsUnique();

            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MaxDiscount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MinOrderAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.StartDate).HasColumnType("datetime");
        });
    }
}
