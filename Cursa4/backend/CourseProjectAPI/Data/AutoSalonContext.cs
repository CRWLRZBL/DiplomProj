using System;
using System.Collections.Generic;
using CourseProjectAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Data;

public partial class AutoSalonContext : DbContext
{
    public AutoSalonContext()
    {
    }

    public AutoSalonContext(DbContextOptions<AutoSalonContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AdditionalOption> AdditionalOptions { get; set; }

    public virtual DbSet<Brand> Brands { get; set; }

    public virtual DbSet<Car> Cars { get; set; }

    public virtual DbSet<Configuration> Configurations { get; set; }

    public virtual DbSet<Model> Models { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderOption> OrderOptions { get; set; }

    public virtual DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserProfiles> UserProfiles { get; set; }

    public virtual DbSet<ChatConversation> ChatConversations { get; set; }

    public virtual DbSet<ChatMessage> ChatMessages { get; set; }

    public virtual DbSet<Color> Colors { get; set; }
    public virtual DbSet<Engine> Engines { get; set; }
    public virtual DbSet<Transmission> Transmissions { get; set; }
    public virtual DbSet<ModelColor> ModelColors { get; set; }
    public virtual DbSet<ModelEngine> ModelEngines { get; set; }
    public virtual DbSet<ModelTransmission> ModelTransmissions { get; set; }

    // Удален метод OnConfiguring - используем строку подключения из конфигурации (appsettings.json или переменные окружения)
    // Это позволяет использовать правильную строку подключения для Docker окружения

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // Настройка для правильной работы с Unicode
            optionsBuilder.UseSqlServer(
                optionsBuilder.Options.FindExtension<Microsoft.EntityFrameworkCore.SqlServer.Infrastructure.Internal.SqlServerOptionsExtension>()?.ConnectionString,
                options => options.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AdditionalOption>(entity =>
        {
            entity.HasKey(e => e.OptionId).HasName("PK__Addition__92C7A1DF1C48BBCA");

            entity.Property(e => e.OptionId).HasColumnName("OptionID");
            entity.Property(e => e.Category).HasMaxLength(50).IsUnicode(true);
            entity.Property(e => e.Description).HasMaxLength(500).IsUnicode(true);
            entity.Property(e => e.OptionName).HasMaxLength(100).IsUnicode(true);
            entity.Property(e => e.OptionPrice).HasColumnType("decimal(15, 2)");
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.HasKey(e => e.BrandId).HasName("PK__Brands__DAD4F3BE1FBD0878");

            entity.HasIndex(e => e.BrandName, "UQ__Brands__2206CE9BE376F531").IsUnique();

            entity.Property(e => e.BrandId).HasColumnName("BrandID");
            entity.Property(e => e.BrandName).HasMaxLength(100).IsUnicode(true);
            entity.Property(e => e.Country).HasMaxLength(50).IsUnicode(true);
            entity.Property(e => e.Description).HasMaxLength(500).IsUnicode(true);
            entity.Property(e => e.LogoUrl)
                .HasMaxLength(500)
                .IsUnicode(true)
                .HasColumnName("LogoURL");
        });

        modelBuilder.Entity<Car>(entity =>
        {
            entity.HasKey(e => e.CarId).HasName("PK__Cars__68A0340ED23855BA");

            entity.HasIndex(e => e.Status, "IX_Cars_Status");

            entity.HasIndex(e => e.Vin, "UQ__Cars__C5DF234CB587C62F").IsUnique();

            entity.Property(e => e.CarId).HasColumnName("CarID");
            entity.Property(e => e.Color).HasMaxLength(50).IsUnicode(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.ImageUrl).HasMaxLength(500).IsUnicode(true);
            entity.Property(e => e.Mileage).HasDefaultValue(0);
            entity.Property(e => e.ModelId).HasColumnName("ModelID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(true)
                .HasDefaultValue("Available");
            entity.Property(e => e.Vin)
                .HasMaxLength(17)
                .IsUnicode(true)
                .HasColumnName("VIN");

            entity.Property(e => e.ListingType).HasMaxLength(10).HasDefaultValue("New");
            entity.Property(e => e.CatalogBrand).HasMaxLength(100);
            entity.Property(e => e.CatalogModel).HasMaxLength(150);
            entity.Property(e => e.CatalogTitle).HasMaxLength(300);
            entity.Property(e => e.ShowPriceFrom).HasDefaultValue(true);
            entity.Property(e => e.IsPublished).HasDefaultValue(true);

            entity.HasOne(d => d.Model).WithMany(p => p.Cars)
                .HasForeignKey(d => d.ModelId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Cars_Models");
        });

        modelBuilder.Entity<Configuration>(entity =>
        {
            entity.HasKey(e => e.ConfigurationId).HasName("PK__Configur__95AA539BA454B50F");

            entity.Property(e => e.ConfigurationId).HasColumnName("ConfigurationID");
            entity.Property(e => e.AdditionalPrice).HasColumnType("decimal(15, 2)");
            entity.Property(e => e.ConfigurationName).HasMaxLength(100).IsUnicode(true);
            entity.Property(e => e.Description).HasMaxLength(500).IsUnicode(true);
            entity.Property(e => e.ModelId).HasColumnName("ModelID");
            entity.Property(e => e.EnginePower).HasColumnName("EnginePower");
            entity.Property(e => e.EngineCapacity).HasColumnType("decimal(4, 2)").HasColumnName("EngineCapacity");
            entity.Property(e => e.FuelType).HasMaxLength(20).IsUnicode(true).HasColumnName("FuelType");
            entity.Property(e => e.TransmissionType).HasMaxLength(20).IsUnicode(true).HasColumnName("TransmissionType");

            entity.HasOne(d => d.Model).WithMany(p => p.Configurations)
                .HasForeignKey(d => d.ModelId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Configurations_Models");
        });

        modelBuilder.Entity<Model>(entity =>
        {
            entity.HasKey(e => e.ModelId).HasName("PK__Models__E8D7A1CC3A8CD188");

            entity.HasIndex(e => e.BrandId, "IX_Models_BrandID");

            entity.Property(e => e.ModelId).HasColumnName("ModelID");
            entity.Property(e => e.BasePrice).HasColumnType("decimal(15, 2)");
            entity.Property(e => e.BodyType).HasMaxLength(50).IsUnicode(true);
            entity.Property(e => e.BrandId).HasColumnName("BrandID");
            entity.Property(e => e.Description).HasMaxLength(1000).IsUnicode(true);
            entity.Property(e => e.EngineCapacity).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.FuelType).HasMaxLength(20).IsUnicode(true);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.ModelName).HasMaxLength(100).IsUnicode(true);
            entity.Property(e => e.ImageUrl).HasMaxLength(500).IsUnicode(true);

            entity.HasOne(d => d.Brand).WithMany(p => p.Models)
                .HasForeignKey(d => d.BrandId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Models_Brands");
        });

        modelBuilder.Entity<Color>(entity =>
        {
            entity.HasKey(e => e.ColorId).HasName("PK_Colors_ColorID");

            entity.HasIndex(e => e.ColorName, "UQ_Colors_ColorName").IsUnique();

            entity.Property(e => e.ColorId).HasColumnName("ColorID");
            entity.Property(e => e.ColorName).HasMaxLength(100);
            entity.Property(e => e.ColorCode).HasMaxLength(20);
            entity.Property(e => e.PriceModifier).HasColumnType("decimal(15, 2)");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
        });

        modelBuilder.Entity<Engine>(entity =>
        {
            entity.HasKey(e => e.EngineId).HasName("PK_Engines_EngineID");

            entity.HasIndex(e => e.EngineName, "UQ_Engines_EngineName").IsUnique();

            entity.Property(e => e.EngineId).HasColumnName("EngineID");
            entity.Property(e => e.EngineName).HasMaxLength(100);
            entity.Property(e => e.EngineCapacity).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.FuelType).HasMaxLength(20);
            entity.Property(e => e.PriceModifier).HasColumnType("decimal(15, 2)");
        });

        modelBuilder.Entity<Transmission>(entity =>
        {
            entity.HasKey(e => e.TransmissionId).HasName("PK_Transmissions_TransmissionID");

            entity.HasIndex(e => e.TransmissionName, "UQ_Transmissions_TransmissionName").IsUnique();

            entity.Property(e => e.TransmissionId).HasColumnName("TransmissionID");
            entity.Property(e => e.TransmissionName).HasMaxLength(100);
            entity.Property(e => e.TransmissionType).HasMaxLength(20);
            entity.Property(e => e.PriceModifier).HasColumnType("decimal(15, 2)");
        });

        modelBuilder.Entity<ModelColor>(entity =>
        {
            entity.HasKey(e => new { e.ModelId, e.ColorId }).HasName("PK_ModelColors");

            entity.Property(e => e.ModelId).HasColumnName("ModelID").IsRequired();
            entity.Property(e => e.ColorId).HasColumnName("ColorID").IsRequired();
            entity.Property(e => e.ImageUrl).HasMaxLength(500);

            entity.HasOne(d => d.Model)
                .WithMany(m => m.ModelColors)
                .HasForeignKey(d => d.ModelId)
                .HasPrincipalKey(m => m.ModelId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ModelColors_Models");

            entity.HasOne(d => d.Color).WithMany(p => p.ModelColors)
                .HasForeignKey(d => d.ColorId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ModelColors_Colors");
        });

        modelBuilder.Entity<ModelEngine>(entity =>
        {
            entity.HasKey(e => new { e.ModelId, e.EngineId }).HasName("PK_ModelEngines");

            entity.Property(e => e.ModelId).HasColumnName("ModelID").IsRequired();
            entity.Property(e => e.EngineId).HasColumnName("EngineID").IsRequired();

            entity.HasOne(d => d.Model)
                .WithMany(m => m.ModelEngines)
                .HasForeignKey(d => d.ModelId)
                .HasPrincipalKey(m => m.ModelId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ModelEngines_Models");

            entity.HasOne(d => d.Engine).WithMany(p => p.ModelEngines)
                .HasForeignKey(d => d.EngineId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ModelEngines_Engines");
        });

        modelBuilder.Entity<ModelTransmission>(entity =>
        {
            entity.HasKey(e => new { e.ModelId, e.TransmissionId }).HasName("PK_ModelTransmissions");

            entity.Property(e => e.ModelId).HasColumnName("ModelID").IsRequired();
            entity.Property(e => e.TransmissionId).HasColumnName("TransmissionID").IsRequired();

            entity.HasOne(d => d.Model)
                .WithMany(m => m.ModelTransmissions)
                .HasForeignKey(d => d.ModelId)
                .HasPrincipalKey(m => m.ModelId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ModelTransmissions_Models");

            entity.HasOne(d => d.Transmission).WithMany(p => p.ModelTransmissions)
                .HasForeignKey(d => d.TransmissionId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ModelTransmissions_Transmissions");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("PK__Orders__C3905BAF5870167A");

            entity.ToTable(tb => tb.HasTrigger("tr_Orders_StatusChange"));

            entity.HasIndex(e => e.OrderStatus, "IX_Orders_Status");

            entity.HasIndex(e => e.UserId, "IX_Orders_UserID");

            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.CarId).HasColumnName("CarID");
            entity.Property(e => e.ConfigurationId).HasColumnName("ConfigurationID");
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.OrderDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.OrderStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(15, 2)");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Car).WithMany(p => p.Orders)
                .HasForeignKey(d => d.CarId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Cars");

            entity.HasOne(d => d.Configuration).WithMany(p => p.Orders)
                .HasForeignKey(d => d.ConfigurationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Configurations");

            entity.HasOne(d => d.User).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Users");
        });

        modelBuilder.Entity<OrderOption>(entity =>
        {
            entity.HasKey(e => e.OrderOptionId).HasName("PK__OrderOpt__59E1EBBC50C34C36");

            entity.Property(e => e.OrderOptionId).HasColumnName("OrderOptionID");
            entity.Property(e => e.OptionId).HasColumnName("OptionID");
            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.PriceAtOrder).HasColumnType("decimal(15, 2)");
            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.Option).WithMany(p => p.OrderOptions)
                .HasForeignKey(d => d.OptionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderOptions_AdditionalOptions");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderOptions)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderOptions_Orders");
        });

        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId).HasName("PK__OrderSta__4D7B4ADDAA186F83");

            entity.ToTable("OrderStatusHistory");

            entity.Property(e => e.HistoryId).HasColumnName("HistoryID");
            entity.Property(e => e.ChangedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.Status).HasMaxLength(20);

            entity.HasOne(d => d.ChangedByNavigation).WithMany(p => p.OrderStatusHistories)
                .HasForeignKey(d => d.ChangedBy)
                .HasConstraintName("FK_OrderStatusHistory_Users");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderStatusHistories)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderStatusHistory_Orders");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__Roles__8AFACE3A71737522");

            entity.HasIndex(e => e.RoleName, "UQ__Roles__8A2B61609852683A").IsUnique();

            entity.Property(e => e.RoleId).HasColumnName("RoleID");
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CCAC05B3A282");

            entity.ToTable(tb =>
                {
                    tb.HasTrigger("tr_Users_PreventDuplicateEmail");
                    tb.HasTrigger("tr_Users_UpdateTimestamp");
                });

            entity.HasIndex(e => e.Email, "IX_Users_Email");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D1053433B6664A").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.RoleId).HasColumnName("RoleID");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Users_Roles");
        });

        modelBuilder.Entity<UserProfiles>(entity =>
        {
            entity.HasKey(e => e.ProfileId).HasName("PK__UserProf__290C8884920A62CC");

            entity.HasIndex(e => e.UserId, "UQ__UserProf__1788CCAD084141F5").IsUnique();

            entity.Property(e => e.ProfileId).HasColumnName("ProfileID");
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithOne(p => p.UserProfiles)
                .HasForeignKey<UserProfiles>(d => d.UserId)
                .HasConstraintName("FK_UserProfiles_Users");
        });

        modelBuilder.Entity<ChatConversation>(entity =>
        {
            entity.ToTable("ChatConversations");
            entity.HasKey(e => e.ChatConversationId);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasIndex(e => e.ClientUserId, "IX_ChatConversations_ClientUserId")
                .IsUnique()
                .HasFilter("[ClientUserId] IS NOT NULL");

            entity.HasIndex(e => new { e.StaffKeyUser1, e.StaffKeyUser2 }, "IX_ChatConversations_StaffPair")
                .IsUnique()
                .HasFilter("[ConversationType] = 1 AND [StaffKeyUser1] IS NOT NULL");

            entity.HasOne(d => d.ClientUser)
                .WithMany(p => p.ClientChatConversations)
                .HasForeignKey(d => d.ClientUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_ChatConversations_ClientUser");

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.StaffKeyUser1)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_ChatConversations_StaffKeyUser1");

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.StaffKeyUser2)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_ChatConversations_StaffKeyUser2");
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("ChatMessages");
            entity.HasKey(e => e.ChatMessageId);
            entity.Property(e => e.Body).HasMaxLength(2000).IsUnicode(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Conversation)
                .WithMany(p => p.Messages)
                .HasForeignKey(d => d.ChatConversationId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ChatMessages_Conversation");

            entity.HasOne(d => d.Sender)
                .WithMany(p => p.SentChatMessages)
                .HasForeignKey(d => d.SenderUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_ChatMessages_Sender");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
