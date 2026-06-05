using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<POI> POIs { get; set; }
        public DbSet<POITranslation> POITranslations { get; set; }
        public DbSet<AudioFile> AudioFiles { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<MenuItemTranslation> MenuItemTranslations { get; set; }
        public DbSet<Tour> Tours { get; set; }
        public DbSet<TourStop> TourStops { get; set; }
        public DbSet<QRCode> QRCodes { get; set; }
        public DbSet<VisitLog> VisitLogs { get; set; }
        public DbSet<AdminUser> AdminUsers { get; set; }
        public DbSet<QuizQuestion> QuizQuestions { get; set; }
        public DbSet<QuizQuestionTranslation> QuizQuestionTranslations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // POI Unique Slug + Category/IsActive Indexes
            modelBuilder.Entity<POI>()
                .HasIndex(p => p.Slug)
                .IsUnique();

            modelBuilder.Entity<POI>()
                .HasIndex(p => p.Category);

            modelBuilder.Entity<POI>()
                .HasIndex(p => p.IsActive);

            // QRCode Unique Code
            modelBuilder.Entity<QRCode>()
                .HasIndex(q => q.Code)
                .IsUnique();

            // AdminUser Unique Username
            modelBuilder.Entity<AdminUser>()
                .HasIndex(a => a.Username)
                .IsUnique();

            // POITranslation Composite Unique (POIId, LanguageCode)
            modelBuilder.Entity<POITranslation>()
                .HasIndex(t => new { t.POIId, t.LanguageCode })
                .IsUnique();

            // MenuItemTranslation Composite Unique (MenuItemId, LanguageCode)
            modelBuilder.Entity<MenuItemTranslation>()
                .HasIndex(m => new { m.MenuItemId, m.LanguageCode })
                .IsUnique();

            // Configure Relationships and Cascade Deletes

            // POI -> POITranslations (Cascade)
            modelBuilder.Entity<POITranslation>()
                .HasOne(t => t.POI)
                .WithMany(p => p.Translations)
                .HasForeignKey(t => t.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // POI -> AudioFiles (Cascade)
            modelBuilder.Entity<AudioFile>()
                .HasOne(a => a.POI)
                .WithMany(p => p.AudioFiles)
                .HasForeignKey(a => a.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // POI -> MenuItems (Cascade)
            modelBuilder.Entity<MenuItem>()
                .HasOne(m => m.POI)
                .WithMany(p => p.MenuItems)
                .HasForeignKey(m => m.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MenuItem>()
                .Property(m => m.Price)
                .HasColumnType("decimal(18, 2)");

            // MenuItem -> MenuItemTranslations (Cascade)
            modelBuilder.Entity<MenuItemTranslation>()
                .HasOne(t => t.MenuItem)
                .WithMany(m => m.Translations)
                .HasForeignKey(t => t.MenuItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // POI -> QRCodes (Cascade)
            modelBuilder.Entity<QRCode>()
                .HasOne(q => q.POI)
                .WithMany(p => p.QRCodes)
                .HasForeignKey(q => q.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // POI -> VisitLogs (Cascade)
            modelBuilder.Entity<VisitLog>()
                .HasOne(v => v.POI)
                .WithMany(p => p.VisitLogs)
                .HasForeignKey(v => v.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // Tour -> TourStops (Cascade)
            modelBuilder.Entity<TourStop>()
                .HasOne(ts => ts.Tour)
                .WithMany(t => t.Stops)
                .HasForeignKey(ts => ts.TourId)
                .OnDelete(DeleteBehavior.Cascade);

            // TourStop -> POI (Restrict/NoAction to prevent multiple cascade paths if Tour is deleted)
            modelBuilder.Entity<TourStop>()
                .HasOne(ts => ts.POI)
                .WithMany()
                .HasForeignKey(ts => ts.POIId)
                .OnDelete(DeleteBehavior.Restrict);

            // QuizQuestion -> POI (Cascade)
            modelBuilder.Entity<QuizQuestion>()
                .HasOne(q => q.POI)
                .WithMany()
                .HasForeignKey(q => q.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // QuizQuestion -> QuizQuestionTranslation (Cascade)
            modelBuilder.Entity<QuizQuestionTranslation>()
                .HasOne(t => t.QuizQuestion)
                .WithMany(q => q.Translations)
                .HasForeignKey(t => t.QuizQuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
