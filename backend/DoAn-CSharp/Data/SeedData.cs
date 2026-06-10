using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var context = new AppDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<AppDbContext>>());

            await context.Database.MigrateAsync();

            var adminUser = await context.AdminUsers.FirstOrDefaultAsync(u => u.Username == "admin");
            if (adminUser == null)
            {
                adminUser = new AdminUser
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234"),
                    Role = "admin",
                    CreatedAt = DateTime.UtcNow
                };
                await context.AdminUsers.AddAsync(adminUser);
            }
            else
            {
                adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234");
                context.AdminUsers.Update(adminUser);
            }
            await context.SaveChangesAsync();

            if (!await context.Languages.AnyAsync())
            {
                var languages = new[]
                {
                    new Language { Code = "vi", Name = "Vietnamese", NativeName = "Tiếng Việt", IsActive = true, SortOrder = 1 },
                    new Language { Code = "en", Name = "English", NativeName = "English", IsActive = true, SortOrder = 2 }
                };
                await context.Languages.AddRangeAsync(languages);
                await context.SaveChangesAsync();
            }

            if (!await context.POICategories.AnyAsync())
            {
                var categories = new[]
                {
                    new POICategory { Slug = "seafood", Name = "Hải sản", Color = "#007BFF", SortOrder = 1 },
                    new POICategory { Slug = "restaurant", Name = "Nhà hàng", Color = "#FF5733", SortOrder = 2 },
                    new POICategory { Slug = "bbq", Name = "Nướng & Lẩu", Color = "#DC3545", SortOrder = 3 },
                    new POICategory { Slug = "vietnamese_food", Name = "Món Việt", Color = "#28A745", SortOrder = 4 },
                    new POICategory { Slug = "cafe", Name = "Cafe & Tráng miệng", Color = "#8B4513", SortOrder = 5 }
                };
                await context.POICategories.AddRangeAsync(categories);
                await context.SaveChangesAsync();
            }

            if (!await context.POIs.AnyAsync())
            {
                var pois = GetPoisToSeed();
                await context.POIs.AddRangeAsync(pois);
                await context.SaveChangesAsync();
            }

            if (!await context.Tours.AnyAsync())
            {
                var tour = new Tour
                {
                    Name = "Khám phá Ốc Vĩnh Khánh",
                    Description = "Hành trình trải nghiệm các quán ốc huyền thoại trên con đường sầm uất nhất Quận 4.",
                    EstimatedMinutes = 60,
                    DistanceKm = 1.5,
                    IsActive = true,
                    Stops = new List<TourStop>
                    {
                        new TourStop { POIId = 1, StopOrder = 1, TransitionNote = "Bắt đầu tại Ốc Oanh." },
                        new TourStop { POIId = 2, StopOrder = 2, TransitionNote = "Đi bộ xuống cuối đường đến Ốc Đào." }
                    }
                };
                await context.Tours.AddAsync(tour);
                await context.SaveChangesAsync();
            }
        }

        private static List<POI> GetPoisToSeed()
        {
            var list = new List<POI>();

            var poi0 = new POI
            {
                Name = "Ốc Oanh",
                Slug = "oc-oanh",
                Latitude = 10.761,
                Longitude = 106.7045,
                Address = "Ốc Oanh, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 10,
                Rating = 4.2,
                ReviewCount = 500,
                ImageUrl = "http://localhost:5011/imgs/ocOanh.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.761,106.7045",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/ocOanh.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi0.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Ốc Oanh", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Ốc Oanh. A must-visit destination for food lovers.", AudioText = "Welcome to Ốc Oanh. We are delighted to serve you our best signature dishes." });
            poi0.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Oanh", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Ốc Oanh. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Ốc Oanh. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi0);

            var poi1 = new POI
            {
                Name = "Ốc Đào",
                Slug = "oc-dao",
                Latitude = 10.7585,
                Longitude = 106.7021,
                Address = "Ốc Đào, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 9,
                Rating = 4.3,
                ReviewCount = 550,
                ImageUrl = "http://localhost:5011/imgs/ocDao.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7585,106.7021",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/ocDao.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi1.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Ốc Đào", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Ốc Đào. A must-visit destination for food lovers.", AudioText = "Welcome to Ốc Đào. We are delighted to serve you our best signature dishes." });
            poi1.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Đào", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Ốc Đào. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Ốc Đào. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi1);

            var poi2 = new POI
            {
                Name = "Ốc Sáu Nở",
                Slug = "oc-sau-no",
                Latitude = 10.762,
                Longitude = 106.705,
                Address = "Ốc Sáu Nở, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 8,
                Rating = 4.4,
                ReviewCount = 600,
                ImageUrl = "http://localhost:5011/imgs/ocSauNo.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.762,106.705",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/ocSauNo.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi2.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Ốc Sáu Nở", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Ốc Sáu Nở. A must-visit destination for food lovers.", AudioText = "Welcome to Ốc Sáu Nở. We are delighted to serve you our best signature dishes." });
            poi2.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Sáu Nở", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Ốc Sáu Nở. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Ốc Sáu Nở. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi2);

            var poi3 = new POI
            {
                Name = "Ốc Vũ",
                Slug = "oc-vu",
                Latitude = 10.763,
                Longitude = 106.7065,
                Address = "Ốc Vũ, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 10,
                Rating = 4.5,
                ReviewCount = 650,
                ImageUrl = "http://localhost:5011/imgs/ocVu.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.763,106.7065",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/ocVu.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi3.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Ốc Vũ", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Ốc Vũ. A must-visit destination for food lovers.", AudioText = "Welcome to Ốc Vũ. We are delighted to serve you our best signature dishes." });
            poi3.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Vũ", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Ốc Vũ. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Ốc Vũ. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi3);

            var poi4 = new POI
            {
                Name = "Ốc Thảo",
                Slug = "oc-thao",
                Latitude = 10.764,
                Longitude = 106.708,
                Address = "Ốc Thảo, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 9,
                Rating = 4.6,
                ReviewCount = 700,
                ImageUrl = "http://localhost:5011/imgs/ocThao.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.764,106.708",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/ocThao.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1627012351222-1d54e4eb1f02?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi4.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Ốc Thảo", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Ốc Thảo. A must-visit destination for food lovers.", AudioText = "Welcome to Ốc Thảo. We are delighted to serve you our best signature dishes." });
            poi4.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Thảo", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Ốc Thảo. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Ốc Thảo. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi4);

            var poi5 = new POI
            {
                Name = "Ốc Phát",
                Slug = "oc-phat",
                Latitude = 10.7615,
                Longitude = 106.7048,
                Address = "Ốc Phát, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 8,
                Rating = 4.7,
                ReviewCount = 750,
                ImageUrl = "http://localhost:5011/imgs/ocPhat.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7615,106.7048",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/ocPhat.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1564671165093-20688ff1fffa?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi5.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Ốc Phát", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Ốc Phát. A must-visit destination for food lovers.", AudioText = "Welcome to Ốc Phát. We are delighted to serve you our best signature dishes." });
            poi5.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Phát", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Ốc Phát. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Ốc Phát. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi5);

            var poi6 = new POI
            {
                Name = "Ốc Tô",
                Slug = "oc-to",
                Latitude = 10.759,
                Longitude = 106.703,
                Address = "Ốc Tô, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 10,
                Rating = 4.2,
                ReviewCount = 800,
                ImageUrl = "http://localhost:5011/imgs/ocTo.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.759,106.703",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/ocTo.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1594220302187-548d88e0e37a?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi6.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Ốc Tô", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Ốc Tô. A must-visit destination for food lovers.", AudioText = "Welcome to Ốc Tô. We are delighted to serve you our best signature dishes." });
            poi6.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Tô", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Ốc Tô. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Ốc Tô. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi6);

            var poi7 = new POI
            {
                Name = "Ốc Cúc",
                Slug = "oc-cuc",
                Latitude = 10.76,
                Longitude = 106.704,
                Address = "Ốc Cúc, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 9,
                Rating = 4.3,
                ReviewCount = 850,
                ImageUrl = "https://images.unsplash.com/photo-1560717845-968823efbee1?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.76,106.704",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1560717845-968823efbee1?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi7.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Ốc Cúc", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Ốc Cúc. A must-visit destination for food lovers.", AudioText = "Welcome to Ốc Cúc. We are delighted to serve you our best signature dishes." });
            poi7.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Cúc", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Ốc Cúc. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Ốc Cúc. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi7);

            var poi8 = new POI
            {
                Name = "Hải Sản Biển Ngọc",
                Slug = "hai-san-bien-ngoc",
                Latitude = 10.7635,
                Longitude = 106.7075,
                Address = "Hải Sản Biển Ngọc, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 8,
                Rating = 4.4,
                ReviewCount = 900,
                ImageUrl = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7635,106.7075",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi8.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Hải Sản Biển Ngọc", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Hải Sản Biển Ngọc. A must-visit destination for food lovers.", AudioText = "Welcome to Hải Sản Biển Ngọc. We are delighted to serve you our best signature dishes." });
            poi8.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Hải Sản Biển Ngọc", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Hải Sản Biển Ngọc. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Hải Sản Biển Ngọc. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi8);

            var poi9 = new POI
            {
                Name = "Ốc Đêm Vĩnh Khánh",
                Slug = "oc-dem-vinh-khanh",
                Latitude = 10.7625,
                Longitude = 106.706,
                Address = "Ốc Đêm Vĩnh Khánh, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "seafood",
                Priority = 10,
                Rating = 4.5,
                ReviewCount = 950,
                ImageUrl = "http://localhost:5011/imgs/ocDemVinhKhanh.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7625,106.706",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/ocDemVinhKhanh.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi9.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Ốc Đêm Vĩnh Khánh", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Ốc Đêm Vĩnh Khánh. A must-visit destination for food lovers.", AudioText = "Welcome to Ốc Đêm Vĩnh Khánh. We are delighted to serve you our best signature dishes." });
            poi9.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Đêm Vĩnh Khánh", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Ốc Đêm Vĩnh Khánh. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Ốc Đêm Vĩnh Khánh. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi9);

            var poi10 = new POI
            {
                Name = "Lãng Restaurant",
                Slug = "lang-restaurant",
                Latitude = 10.7605,
                Longitude = 106.7042,
                Address = "Lãng Restaurant, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "restaurant",
                Priority = 9,
                Rating = 4.6,
                ReviewCount = 1000,
                ImageUrl = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7605,106.7042",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi10.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Lãng Restaurant", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Lãng Restaurant. A must-visit destination for food lovers.", AudioText = "Welcome to Lãng Restaurant. We are delighted to serve you our best signature dishes." });
            poi10.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Lãng Restaurant", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Lãng Restaurant. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Lãng Restaurant. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi10);

            var poi11 = new POI
            {
                Name = "Quán Nhậu Tự Do",
                Slug = "quan-nhau-tu-do",
                Latitude = 10.7645,
                Longitude = 106.7085,
                Address = "Quán Nhậu Tự Do, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "restaurant",
                Priority = 8,
                Rating = 4.7,
                ReviewCount = 1050,
                ImageUrl = "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7645,106.7085",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi11.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Quán Nhậu Tự Do", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Quán Nhậu Tự Do. A must-visit destination for food lovers.", AudioText = "Welcome to Quán Nhậu Tự Do. We are delighted to serve you our best signature dishes." });
            poi11.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Quán Nhậu Tự Do", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Quán Nhậu Tự Do. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Quán Nhậu Tự Do. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi11);

            var poi12 = new POI
            {
                Name = "Thuận Việt BBQ & Hotpot",
                Slug = "thuan-viet-bbq",
                Latitude = 10.7618,
                Longitude = 106.7052,
                Address = "Thuận Việt BBQ & Hotpot, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "bbq",
                Priority = 10,
                Rating = 4.2,
                ReviewCount = 1100,
                ImageUrl = "http://localhost:5011/imgs/thuanVietBBQ.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7618,106.7052",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/thuanVietBBQ.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi12.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Thuận Việt BBQ & Hotpot", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Thuận Việt BBQ & Hotpot. A must-visit destination for food lovers.", AudioText = "Welcome to Thuận Việt BBQ & Hotpot. We are delighted to serve you our best signature dishes." });
            poi12.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Thuận Việt BBQ & Hotpot", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Thuận Việt BBQ & Hotpot. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Thuận Việt BBQ & Hotpot. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi12);

            var poi13 = new POI
            {
                Name = "Thế Giới Bò",
                Slug = "the-gioi-bo",
                Latitude = 10.7592,
                Longitude = 106.7028,
                Address = "Thế Giới Bò, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "bbq",
                Priority = 9,
                Rating = 4.3,
                ReviewCount = 1150,
                ImageUrl = "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7592,106.7028",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi13.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Thế Giới Bò", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Thế Giới Bò. A must-visit destination for food lovers.", AudioText = "Welcome to Thế Giới Bò. We are delighted to serve you our best signature dishes." });
            poi13.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Thế Giới Bò", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Thế Giới Bò. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Thế Giới Bò. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi13);

            var poi14 = new POI
            {
                Name = "Bò Nướng Vĩnh Khánh",
                Slug = "bo-nuong-vinh-khanh",
                Latitude = 10.7632,
                Longitude = 106.7068,
                Address = "Bò Nướng Vĩnh Khánh, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "bbq",
                Priority = 8,
                Rating = 4.4,
                ReviewCount = 1200,
                ImageUrl = "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7632,106.7068",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi14.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Bò Nướng Vĩnh Khánh", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Bò Nướng Vĩnh Khánh. A must-visit destination for food lovers.", AudioText = "Welcome to Bò Nướng Vĩnh Khánh. We are delighted to serve you our best signature dishes." });
            poi14.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Bò Nướng Vĩnh Khánh", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Bò Nướng Vĩnh Khánh. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Bò Nướng Vĩnh Khánh. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi14);

            var poi15 = new POI
            {
                Name = "Nem Nướng Quê Nhà",
                Slug = "nem-nuong-que-nha",
                Latitude = 10.7602,
                Longitude = 106.7035,
                Address = "Nem Nướng Quê Nhà, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "vietnamese_food",
                Priority = 10,
                Rating = 4.5,
                ReviewCount = 1250,
                ImageUrl = "http://localhost:5011/imgs/nemNuong.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7602,106.7035",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/nemNuong.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1556694795-b6423e3e44f1?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi15.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Nem Nướng Quê Nhà", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Nem Nướng Quê Nhà. A must-visit destination for food lovers.", AudioText = "Welcome to Nem Nướng Quê Nhà. We are delighted to serve you our best signature dishes." });
            poi15.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Nem Nướng Quê Nhà", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Nem Nướng Quê Nhà. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Nem Nướng Quê Nhà. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi15);

            var poi16 = new POI
            {
                Name = "Bánh Xèo Miền Tây",
                Slug = "banh-xeo-mien-tay",
                Latitude = 10.7642,
                Longitude = 106.7082,
                Address = "Bánh Xèo Miền Tây, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "vietnamese_food",
                Priority = 9,
                Rating = 4.6,
                ReviewCount = 1300,
                ImageUrl = "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7642,106.7082",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi16.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Bánh Xèo Miền Tây", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Bánh Xèo Miền Tây. A must-visit destination for food lovers.", AudioText = "Welcome to Bánh Xèo Miền Tây. We are delighted to serve you our best signature dishes." });
            poi16.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Bánh Xèo Miền Tây", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Bánh Xèo Miền Tây. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Bánh Xèo Miền Tây. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi16);

            var poi17 = new POI
            {
                Name = "Bún Thái Hải Sản Vĩnh Khánh",
                Slug = "bun-thai-hai-san",
                Latitude = 10.7612,
                Longitude = 106.704,
                Address = "Bún Thái Hải Sản Vĩnh Khánh, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "vietnamese_food",
                Priority = 8,
                Rating = 4.7,
                ReviewCount = 1350,
                ImageUrl = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7612,106.704",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi17.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Bún Thái Hải Sản Vĩnh Khánh", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Bún Thái Hải Sản Vĩnh Khánh. A must-visit destination for food lovers.", AudioText = "Welcome to Bún Thái Hải Sản Vĩnh Khánh. We are delighted to serve you our best signature dishes." });
            poi17.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Bún Thái Hải Sản Vĩnh Khánh", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Bún Thái Hải Sản Vĩnh Khánh. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Bún Thái Hải Sản Vĩnh Khánh. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi17);

            var poi18 = new POI
            {
                Name = "Cafe Vĩnh Khánh Corner",
                Slug = "cafe-vinh-khanh-corner",
                Latitude = 10.7588,
                Longitude = 106.7018,
                Address = "Cafe Vĩnh Khánh Corner, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "cafe",
                Priority = 10,
                Rating = 4.2,
                ReviewCount = 1400,
                ImageUrl = "http://localhost:5011/imgs/cafeVinhKhanh.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7588,106.7018",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "http://localhost:5011/imgs/cafeVinhKhanh.jpg", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi18.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Cafe Vĩnh Khánh Corner", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Cafe Vĩnh Khánh Corner. A must-visit destination for food lovers.", AudioText = "Welcome to Cafe Vĩnh Khánh Corner. We are delighted to serve you our best signature dishes." });
            poi18.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Cafe Vĩnh Khánh Corner", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Cafe Vĩnh Khánh Corner. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Cafe Vĩnh Khánh Corner. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi18);

            var poi19 = new POI
            {
                Name = "Riverside Coffee Q4",
                Slug = "riverside-coffee-q4",
                Latitude = 10.7655,
                Longitude = 106.7095,
                Address = "Riverside Coffee Q4, Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "cafe",
                Priority = 9,
                Rating = 4.3,
                ReviewCount = 1450,
                ImageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7655,106.7095",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            poi19.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Riverside Coffee Q4", ShortDescription = "A great place on Vinh Khanh street.", FullDescription = "Experience the vibrant atmosphere and delicious flavors at Riverside Coffee Q4. A must-visit destination for food lovers.", AudioText = "Welcome to Riverside Coffee Q4. We are delighted to serve you our best signature dishes." });
            poi19.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Riverside Coffee Q4", ShortDescription = "Địa điểm nổi bật tại khu Vĩnh Khánh.", FullDescription = "Trải nghiệm không khí sôi động và thưởng thức những hương vị tuyệt vời tại Riverside Coffee Q4. Một điểm đến không thể bỏ qua.", AudioText = "Chào mừng bạn đến với Riverside Coffee Q4. Nơi đây hứa hẹn mang lại những trải nghiệm ẩm thực đáng nhớ nhất." });
            list.Add(poi19);

            return list;
        }
    }
}
