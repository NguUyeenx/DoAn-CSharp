using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Existing
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

        // New
        public DbSet<Owner> Owners { get; set; }
        public DbSet<Language> Languages { get; set; }
        public DbSet<POICategory> POICategories { get; set; }
        public DbSet<AnalyticsEvent> AnalyticsEvents { get; set; }
        public DbSet<POIImage> POIImages { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ── POIImage ──────────────────────────────────────────────────
            modelBuilder.Entity<POIImage>()
                .HasOne(i => i.POI)
                .WithMany(p => p.Images)
                .HasForeignKey(i => i.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── Notification ──────────────────────────────────────────────
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Owner)
                .WithMany(o => o.Notifications)
                .HasForeignKey(n => n.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);

            // ── Language: PK is string Code ──────────────────────────────
            modelBuilder.Entity<Language>()
                .HasKey(l => l.Code);

            // ── Owner ──────────────────────────────────────────────────────
            modelBuilder.Entity<Owner>()
                .HasIndex(u => u.Username)
                .IsUnique();
            modelBuilder.Entity<Owner>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // ── POICategory ───────────────────────────────────────────────
            modelBuilder.Entity<POICategory>()
                .HasIndex(c => c.Slug)
                .IsUnique();

            // ── POI ───────────────────────────────────────────────────────
            modelBuilder.Entity<POI>()
                .HasIndex(p => p.Slug)
                .IsUnique();
            modelBuilder.Entity<POI>()
                .HasIndex(p => p.Category);
            modelBuilder.Entity<POI>()
                .HasIndex(p => p.IsActive);
            modelBuilder.Entity<POI>()
                .HasIndex(p => p.DeletedAt);

            // POI -> POICategory (optional FK)
            modelBuilder.Entity<POI>()
                .HasOne(p => p.POICategory)
                .WithMany(c => c.POIs)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            // POI -> Owner (optional FK)
            modelBuilder.Entity<POI>()
                .HasOne(p => p.Owner)
                .WithMany()
                .HasForeignKey(p => p.OwnerId)
                .OnDelete(DeleteBehavior.SetNull);

            // ── QRCode ────────────────────────────────────────────────────
            modelBuilder.Entity<QRCode>()
                .HasIndex(q => q.Code)
                .IsUnique();

            // ── AdminUser ─────────────────────────────────────────────────
            modelBuilder.Entity<AdminUser>()
                .HasIndex(a => a.Username)
                .IsUnique();

            // ── POITranslation ────────────────────────────────────────────
            modelBuilder.Entity<POITranslation>()
                .HasIndex(t => new { t.POIId, t.LanguageCode })
                .IsUnique();
            modelBuilder.Entity<POITranslation>()
                .HasOne(t => t.POI)
                .WithMany(p => p.Translations)
                .HasForeignKey(t => t.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── AudioFile ─────────────────────────────────────────────────
            modelBuilder.Entity<AudioFile>()
                .HasOne(a => a.POI)
                .WithMany(p => p.AudioFiles)
                .HasForeignKey(a => a.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── MenuItem ──────────────────────────────────────────────────
            modelBuilder.Entity<MenuItem>()
                .HasOne(m => m.POI)
                .WithMany(p => p.MenuItems)
                .HasForeignKey(m => m.POIId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MenuItem>()
                .Property(m => m.Price)
                .HasColumnType("decimal(18, 2)");

            // ── MenuItemTranslation ───────────────────────────────────────
            modelBuilder.Entity<MenuItemTranslation>()
                .HasIndex(m => new { m.MenuItemId, m.LanguageCode })
                .IsUnique();
            modelBuilder.Entity<MenuItemTranslation>()
                .HasOne(t => t.MenuItem)
                .WithMany(m => m.Translations)
                .HasForeignKey(t => t.MenuItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── QRCode -> POI ─────────────────────────────────────────────
            modelBuilder.Entity<QRCode>()
                .HasOne(q => q.POI)
                .WithMany(p => p.QRCodes)
                .HasForeignKey(q => q.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── VisitLog ──────────────────────────────────────────────────
            modelBuilder.Entity<VisitLog>()
                .HasOne(v => v.POI)
                .WithMany(p => p.VisitLogs)
                .HasForeignKey(v => v.POIId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── TourStop ──────────────────────────────────────────────────
            modelBuilder.Entity<TourStop>()
                .HasOne(ts => ts.Tour)
                .WithMany(t => t.Stops)
                .HasForeignKey(ts => ts.TourId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<TourStop>()
                .HasOne(ts => ts.POI)
                .WithMany()
                .HasForeignKey(ts => ts.POIId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── QuizQuestion ──────────────────────────────────────────────
            modelBuilder.Entity<QuizQuestion>()
                .HasOne(q => q.POI)
                .WithMany()
                .HasForeignKey(q => q.POIId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<QuizQuestionTranslation>()
                .HasOne(t => t.QuizQuestion)
                .WithMany(q => q.Translations)
                .HasForeignKey(t => t.QuizQuestionId)
                .OnDelete(DeleteBehavior.Cascade);


        }
    }
}
