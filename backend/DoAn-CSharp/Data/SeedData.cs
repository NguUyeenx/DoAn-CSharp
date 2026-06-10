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
                    new POICategory { Slug = "restaurant", Name = "Nhà hàng", Color = "#FF5733", SortOrder = 1 },
                    new POICategory { Slug = "cafe", Name = "Quán cafe", Color = "#8B4513", SortOrder = 2 },
                    new POICategory { Slug = "street_food", Name = "Ẩm thực đường phố", Color = "#FFA500", SortOrder = 3 }
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

            var ocOanh = new POI
            {
                Name = "Ốc Oanh",
                Slug = "oc-oanh",
                Latitude = 10.7610,
                Longitude = 106.7045,
                Address = "534 Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "street_food",
                Priority = 10,
                Rating = 4.8,
                ReviewCount = 2540,
                ImageUrl = "https://images.unsplash.com/photo-1599507914619-35d259e8f498?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7610,106.7045",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1599507914619-35d259e8f498?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 3 }
                },
                MenuItems = new List<MenuItem>
                {
                    new MenuItem 
                    { 
                        Name = "Ốc hương xào bơ cay", 
                        Price = 150000, 
                        ImageUrl = "https://images.unsplash.com/photo-1574781330855-d0db8ce60179?auto=format&fit=crop&q=80&w=400",
                        Translations = new List<MenuItemTranslation>
                        {
                            new MenuItemTranslation { LanguageCode = "vi", Name = "Ốc hương xào bơ cay", Description = "Món ăn best seller với nước sốt đậm đà." },
                            new MenuItemTranslation { LanguageCode = "en", Name = "Spicy Butter Snails", Description = "Best seller with rich spicy butter sauce." }
                        }
                    },
                    new MenuItem 
                    { 
                        Name = "Càng ghẹ rang muối ớt", 
                        Price = 180000, 
                        ImageUrl = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400",
                        Translations = new List<MenuItemTranslation>
                        {
                            new MenuItemTranslation { LanguageCode = "vi", Name = "Càng ghẹ rang muối", Description = "Càng ghẹ siêu to thịt chắc nịch." },
                            new MenuItemTranslation { LanguageCode = "en", Name = "Salt and Chili Crab Claws", Description = "Huge crab claws roasted with spicy salt." }
                        }
                    },
                    new MenuItem 
                    { 
                        Name = "Sò điệp nướng mỡ hành", 
                        Price = 120000, 
                        ImageUrl = "https://images.unsplash.com/photo-1623854767272-b530513e4b78?auto=format&fit=crop&q=80&w=400",
                        Translations = new List<MenuItemTranslation>
                        {
                            new MenuItemTranslation { LanguageCode = "vi", Name = "Sò điệp nướng mỡ hành", Description = "Sò điệp tươi rói nướng phô mai mỡ hành." },
                            new MenuItemTranslation { LanguageCode = "en", Name = "Grilled Scallops", Description = "Fresh scallops grilled with scallion oil." }
                        }
                    }
                }
            };
            ocOanh.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Oc Oanh Seafood", ShortDescription = "Most famous snail street food.", FullDescription = "A legendary spot for roasted crab claws and spicy snails.", AudioText = "Welcome to Oc Oanh, the most iconic seafood spot on Vinh Khanh street. We are famous for roasted crab claws and spicy snails." });
            ocOanh.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Oanh", ShortDescription = "Quán ốc nổi tiếng nhất Vĩnh Khánh.", FullDescription = "Địa điểm huyền thoại với món càng ghẹ rang muối và ốc hương xào bơ cay.", AudioText = "Chào mừng bạn đến với Ốc Oanh, quán hải sản biểu tượng nhất trên con đường Vĩnh Khánh. Quán chúng tôi nổi danh với món càng ghẹ rang muối và ốc xào bơ tỏi thần thánh." });
            list.Add(ocOanh);

            var ocDao = new POI
            {
                Name = "Ốc Đào",
                Slug = "oc-dao",
                Latitude = 10.7585,
                Longitude = 106.7021,
                Address = "212B/C79 Nguyễn Trãi (Chi nhánh gốc) & Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "restaurant",
                Priority = 9,
                Rating = 4.7,
                ReviewCount = 1890,
                ImageUrl = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7585,106.7021",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1559742811-822873691fc8?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                },
                MenuItems = new List<MenuItem>
                {
                    new MenuItem 
                    { 
                        Name = "Ốc tỏi xào me", 
                        Price = 110000, 
                        ImageUrl = "https://images.unsplash.com/photo-1615887023516-9b24476aeb11?auto=format&fit=crop&q=80&w=400",
                        Translations = new List<MenuItemTranslation>
                        {
                            new MenuItemTranslation { LanguageCode = "vi", Name = "Ốc tỏi xào me", Description = "Ốc tỏi giòn sần sật với sốt me chua ngọt." },
                            new MenuItemTranslation { LanguageCode = "en", Name = "Tamarind Garlic Snails", Description = "Crunchy snails in sweet and sour tamarind sauce." }
                        }
                    },
                    new MenuItem 
                    { 
                        Name = "Bánh mì chấm sốt bơ tỏi", 
                        Price = 20000, 
                        ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
                        Translations = new List<MenuItemTranslation>
                        {
                            new MenuItemTranslation { LanguageCode = "vi", Name = "Bánh mì chấm sốt", Description = "Bánh mì nóng giòn đặc ruột." },
                            new MenuItemTranslation { LanguageCode = "en", Name = "Baguette with Sauce", Description = "Crispy warm baguette perfect for dipping." }
                        }
                    }
                }
            };
            ocDao.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Oc Dao", ShortDescription = "Legendary garlic butter snails.", FullDescription = "Famous for garlic butter sauce snails and fresh scallops.", AudioText = "Enjoy the legendary garlic butter snails at Oc Dao. A must-try destination for seafood lovers." });
            ocDao.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Đào", ShortDescription = "Huyền thoại ốc xào bơ tỏi.", FullDescription = "Nổi tiếng với nước sốt bơ tỏi béo ngậy chấm bánh mì và sò điệp nướng mỡ hành tươi rói.", AudioText = "Thưởng thức món ốc xào bơ tỏi huyền thoại tại Ốc Đào. Nước sốt béo ngậy ăn kèm bánh mì nóng giòn chắc chắn sẽ làm bạn xiêu lòng." });
            list.Add(ocDao);

            var chili = new POI
            {
                Name = "Chili - Lẩu nướng tự chọn",
                Slug = "chili-lau-nuong",
                Latitude = 10.7621,
                Longitude = 106.7055,
                Address = "139 Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "restaurant",
                Priority = 8,
                Rating = 4.5,
                ReviewCount = 850,
                ImageUrl = "https://images.unsplash.com/photo-1544025162-8111142154ea?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7621,106.7055",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1544025162-8111142154ea?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                },
                MenuItems = new List<MenuItem>
                {
                    new MenuItem 
                    { 
                        Name = "Buffet Lẩu Nướng", 
                        Price = 250000, 
                        ImageUrl = "https://images.unsplash.com/photo-1627012351222-1d54e4eb1f02?auto=format&fit=crop&q=80&w=400",
                        Translations = new List<MenuItemTranslation>
                        {
                            new MenuItemTranslation { LanguageCode = "vi", Name = "Buffet Lẩu Nướng", Description = "Hơn 50 món nướng và lẩu hải sản thả ga." },
                            new MenuItemTranslation { LanguageCode = "en", Name = "BBQ & Hotpot Buffet", Description = "Over 50 types of BBQ and seafood hotpot." }
                        }
                    }
                }
            };
            chili.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Chili BBQ & Hotpot", ShortDescription = "Interactive DIY BBQ and Hotpot.", FullDescription = "Grill your own meats or enjoy a bubbling hotpot with friends.", AudioText = "Grill your favorite meats at Chili BBQ and enjoy a fun night with friends." });
            chili.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Chili Lẩu Nướng", ShortDescription = "Lẩu nướng tự chọn phong cách trẻ.", FullDescription = "Tự tay nướng những tảng thịt ướp đậm vị và xì xụp bên nồi lẩu nóng hổi cùng bạn bè.", AudioText = "Trải nghiệm nướng thịt trên than hồng và thưởng thức lẩu hai ngăn cực đã tại Chili. Không gian mở rất thích hợp cho những buổi tụ tập đông người." });
            list.Add(chili);

            var anAn = new POI
            {
                Name = "An An Quán",
                Slug = "an-an-quan",
                Latitude = 10.7611,
                Longitude = 106.7042,
                Address = "531 Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "restaurant",
                Priority = 8,
                Rating = 4.3,
                ReviewCount = 420,
                ImageUrl = "https://images.unsplash.com/photo-1555126634-ae231a4a8c14?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7611,106.7042",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            anAn.Translations.Add(new POITranslation { LanguageCode = "en", Name = "An An Hotpot", ShortDescription = "Casual atmosphere with hotpots.", FullDescription = "Known for its casual atmosphere and range of grilled dishes.", AudioText = "Welcome to An An Quan." });
            anAn.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "An An Quán", ShortDescription = "Không gian ấm cúng.", FullDescription = "Lẩu gia đình hương vị đậm đà.", AudioText = "An An Quán mang đến hương vị lẩu gia đình truyền thống." });
            list.Add(anAn);

            var langQuan = new POI
            {
                Name = "Làng Quán",
                Slug = "lang-quan",
                Latitude = 10.7625,
                Longitude = 106.7061,
                Address = "118 Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "street_food",
                Priority = 7,
                Rating = 4.4,
                ReviewCount = 530,
                ImageUrl = "https://images.unsplash.com/photo-1582878826629-29b7ad1cb461?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7625,106.7061",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            langQuan.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Lang Quan", ShortDescription = "Street snacks and local favorites.", FullDescription = "Explore smaller street snacks and traditional local dishes.", AudioText = "Try some authentic street snacks at Lang Quan." });
            langQuan.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Làng Quán", ShortDescription = "Món nhậu bình dân.", FullDescription = "Các món nhậu bắt mồi, giá cả sinh viên.", AudioText = "Ghé thăm Làng Quán để trải nghiệm đặc sản nhậu bình dân." });
            list.Add(langQuan);

            var hoaQuan = new POI
            {
                Name = "Hoa Quán",
                Slug = "hoa-quan",
                Latitude = 10.7635,
                Longitude = 106.7072,
                Address = "39 Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "street_food",
                Priority = 7,
                Rating = 4.6,
                ReviewCount = 610,
                ImageUrl = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7635,106.7072",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            hoaQuan.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Hoa Restaurant", ShortDescription = "Highly-regarded spot for BBQ.", FullDescription = "A vibrant spot for group gatherings and local BBQ.", AudioText = "Welcome to Hoa Restaurant." });
            hoaQuan.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Hoa Quán", ShortDescription = "Nướng ngói đặc sắc.", FullDescription = "Thịt nướng trên ngói giữ độ ngọt tự nhiên.", AudioText = "Thưởng thức thịt nướng ngói đặc sắc tại Hoa Quán." });
            list.Add(hoaQuan);

            var ocVu = new POI
            {
                Name = "Ốc Vũ",
                Slug = "oc-vu",
                Latitude = 10.7630,
                Longitude = 106.7065,
                Address = "37 Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "street_food",
                Priority = 8,
                Rating = 4.5,
                ReviewCount = 1200,
                ImageUrl = "https://images.unsplash.com/photo-1574781330855-d0db8ce60179?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7630,106.7065",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1574781330855-d0db8ce60179?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 },
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800", IsCover = false, DisplayOrder = 2 }
                }
            };
            ocVu.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Oc Vu", ShortDescription = "A popular spot for fresh seafood.", FullDescription = "A vibrant seafood joint known for its affordable prices and fresh ingredients.", AudioText = "Welcome to Oc Vu, famous for its lively atmosphere and fresh catches of the day." });
            ocVu.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Vũ", ShortDescription = "Ốc bình dân tấp nập.", FullDescription = "Hải sản tươi sống giá sinh viên, không gian vỉa hè thoáng mát.", AudioText = "Chào mừng bạn đến với Ốc Vũ, một điểm hẹn lý tưởng cho những ai thích hải sản tươi ngon với giá bình dân." });
            list.Add(ocVu);

            var ocThao = new POI
            {
                Name = "Ốc Thảo",
                Slug = "oc-thao",
                Latitude = 10.7640,
                Longitude = 106.7080,
                Address = "237/8 Hoàng Diệu (Hẻm Vĩnh Khánh), Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "street_food",
                Priority = 8,
                Rating = 4.6,
                ReviewCount = 1500,
                ImageUrl = "https://images.unsplash.com/photo-1623854767272-b530513e4b78?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7640,106.7080",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1623854767272-b530513e4b78?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 }
                }
            };
            ocThao.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Oc Thao", ShortDescription = "Cozy snail eatery hidden in an alley.", FullDescription = "Discover a local secret with the best coconut snails in town.", AudioText = "Welcome to Oc Thao, a hidden gem offering exquisite seafood flavors." });
            ocThao.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Thảo", ShortDescription = "Đỉnh cao ốc len xào dừa.", FullDescription = "Quán ốc núp hẻm nhưng luôn đông đúc vì nước sốt đặc trưng.", AudioText = "Ốc Thảo là một viên ngọc ẩn giấu, mang đến hương vị ốc len xào dừa béo ngậy khó quên." });
            list.Add(ocThao);

            var bbqNgoi = new POI
            {
                Name = "Quán Nướng Ngói",
                Slug = "quan-nuong-ngoi",
                Latitude = 10.7650,
                Longitude = 106.7090,
                Address = "11 Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "restaurant",
                Priority = 7,
                Rating = 4.4,
                ReviewCount = 800,
                ImageUrl = "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7650,106.7090",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            bbqNgoi.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Tile BBQ", ShortDescription = "Traditional tile-grilled meat.", FullDescription = "Experience cooking your own meat on a hot clay tile.", AudioText = "Tile BBQ is a unique experience where meats are grilled perfectly on traditional clay tiles." });
            bbqNgoi.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Quán Nướng Ngói", ShortDescription = "Bò nướng ngói thơm lừng.", FullDescription = "Nướng thịt trên ngói đất sét giúp giữ trọn vẹn nước ngọt của thịt.", AudioText = "Trải nghiệm phong cách nướng ngói độc đáo, mang đến những miếng thịt mềm và mọng nước." });
            list.Add(bbqNgoi);

            var traSuaMix = new POI
            {
                Name = "Trà Sữa Mix",
                Slug = "tra-sua-mix",
                Latitude = 10.7600,
                Longitude = 106.7030,
                Address = "120 Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "cafe",
                Priority = 6,
                Rating = 4.3,
                ReviewCount = 500,
                ImageUrl = "https://images.unsplash.com/photo-1558857563-b37102e9ea15?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7600,106.7030",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            traSuaMix.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Mix Milk Tea", ShortDescription = "Refreshing drinks and desserts.", FullDescription = "The perfect place to cool down after a spicy seafood meal.", AudioText = "Cool down at Mix Milk Tea with a refreshing selection of bubble teas and desserts." });
            traSuaMix.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Trà Sữa Mix", ShortDescription = "Trà sữa trân châu nhà làm.", FullDescription = "Trạm dừng chân lý tưởng để tráng miệng sau bữa tiệc hải sản cay nồng.", AudioText = "Hạ nhiệt với Trà Sữa Mix, nơi cung cấp những ly trà mát lạnh và trân châu dai ngon." });
            list.Add(traSuaMix);

            var lauBoKhuBa = new POI
            {
                Name = "Lẩu Bò Khu Ba",
                Slug = "lau-bo-khu-ba",
                Latitude = 10.7595,
                Longitude = 106.7025,
                Address = "Khu Ba, Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "restaurant",
                Priority = 7,
                Rating = 4.4,
                ReviewCount = 950,
                ImageUrl = "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7595,106.7025",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<POIImage>
                {
                    new POIImage { ImageUrl = "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800", IsCover = true, DisplayOrder = 1 }
                }
            };
            lauBoKhuBa.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Khu Ba Beef Hotpot", ShortDescription = "Hearty and rich beef hotpot.", FullDescription = "A local favorite for late-night beef hotpot packed with flavors and fresh vegetables.", AudioText = "Warm up your evening with a hearty beef hotpot at Khu Ba." });
            lauBoKhuBa.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Lẩu Bò Khu Ba", ShortDescription = "Lẩu bò bình dân đậm vị.", FullDescription = "Điểm đến quen thuộc cho những tín đồ mê lẩu bò ngon bổ rẻ.", AudioText = "Hòa mình vào không khí nhộn nhịp và thưởng thức nồi lẩu bò nghi ngút khói tại Khu Ba." });
            list.Add(lauBoKhuBa);

            var supCua = new POI
            {
                Name = "Súp Cua Cô Lan",
                Slug = "sup-cua-co-lan",
                Latitude = 10.7615,
                Longitude = 106.7050,
                Address = "Vỉa hè Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "street_food",
                Priority = 6,
                Rating = 4.7,
                ReviewCount = 600,
                ImageUrl = "https://images.unsplash.com/photo-1548943487-a2e4b43b4850?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7615,106.7050",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            supCua.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Co Lan Crab Soup", ShortDescription = "Thick and savory crab soup.", FullDescription = "A perfect appetizer street food with crab meat, quail eggs, and herbs.", AudioText = "Grab a quick and delicious bowl of crab soup at Co Lan's street stall." });
            supCua.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Súp Cua Cô Lan", ShortDescription = "Súp cua óc heo đặc biệt.", FullDescription = "Chén súp nóng hổi đầy đặn thịt cua, óc heo béo ngậy và trứng cút.", AudioText = "Mở đầu bữa tiệc ẩm thực bằng một chén súp cua óc heo nóng hổi và đầy dinh dưỡng." });
            list.Add(supCua);

            var cheThai = new POI
            {
                Name = "Chè Thái Ý Phương (Chi nhánh Quận 4)",
                Slug = "che-thai-y-phuong",
                Latitude = 10.7580,
                Longitude = 106.7015,
                Address = "Gần ngã ba Vĩnh Khánh - Hoàng Diệu, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "cafe",
                Priority = 7,
                Rating = 4.5,
                ReviewCount = 2100,
                ImageUrl = "https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7580,106.7015",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            cheThai.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Y Phuong Thai Sweet Soup", ShortDescription = "Famous Thai sweet soup dessert.", FullDescription = "Indulge in a bowl of sweet, creamy, and fruity Thai dessert.", AudioText = "Treat yourself to the famous Y Phuong Thai sweet soup, a perfect blend of fruits and coconut milk." });
            cheThai.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Chè Thái Ý Phương", ShortDescription = "Chè Thái sầu riêng trứ danh.", FullDescription = "Ly chè Thái đẫm sầu riêng, thạch trái cây giòn sần sật béo ngậy.", AudioText = "Giải khát cực đã với ly chè Thái sầu riêng trứ danh, đậm đà vị cốt dừa và thạch trái cây." });
            list.Add(cheThai);

            var banhTrang = new POI
            {
                Name = "Bánh Tráng Nướng Đà Lạt",
                Slug = "banh-trang-nuong-da-lat",
                Latitude = 10.7628,
                Longitude = 106.7060,
                Address = "Dọc đường Vĩnh Khánh, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "street_food",
                Priority = 6,
                Rating = 4.6,
                ReviewCount = 450,
                ImageUrl = "https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7628,106.7060",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            banhTrang.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Da Lat Pizza", ShortDescription = "Crispy Vietnamese rice paper pizza.", FullDescription = "Grilled rice paper topped with egg, sausage, dried shrimp, and cheese.", AudioText = "Snack on a crispy Vietnamese pizza straight from the charcoal grill." });
            banhTrang.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Bánh Tráng Nướng", ShortDescription = "Pizza Việt Nam giòn rụm.", FullDescription = "Bánh tráng nướng than hoa thơm lức với trứng cút, xúc xích và phô mai.", AudioText = "Đừng bỏ qua món bánh tráng nướng giòn rụm thơm lừng mùi bơ và hành phi nhé." });
            list.Add(banhTrang);

            var quanNhau = new POI
            {
                Name = "Quán Nhậu Tự Do",
                Slug = "quan-nhau-tu-do",
                Latitude = 10.7645,
                Longitude = 106.7085,
                Address = "Đầu đường Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
                TriggerRadiusMeters = 30,
                Category = "restaurant",
                Priority = 8,
                Rating = 4.3,
                ReviewCount = 720,
                ImageUrl = "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&q=80&w=800",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7645,106.7085",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            quanNhau.Translations.Add(new POITranslation { LanguageCode = "en", Name = "Tu Do Beer Club", ShortDescription = "Lively drinking spot with great food.", FullDescription = "Enjoy cold beers and excellent finger foods in a highly energetic environment.", AudioText = "End your night at Tu Do with cold beers and a vibrant local atmosphere." });
            quanNhau.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Quán Nhậu Tự Do", ShortDescription = "Không gian bia tươi cực chill.", FullDescription = "Tụ tập bạn bè, uống bia lạnh và nhắm mồi cực cuốn trong không gian mở.", AudioText = "Cùng nâng ly và tận hưởng buổi tối sôi động cùng bạn bè tại Quán Nhậu Tự Do." });
            list.Add(quanNhau);

            return list;
        }
    }
}
