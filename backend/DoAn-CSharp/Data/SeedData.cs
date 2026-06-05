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

            // Ensure database is created and migrated
            await context.Database.MigrateAsync();

            // Seed Admin User
            if (!await context.AdminUsers.AnyAsync())
            {
                var adminUser = new AdminUser
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = "admin",
                    CreatedAt = DateTime.UtcNow
                };
                await context.AdminUsers.AddAsync(adminUser);
                await context.SaveChangesAsync();
            }

            // Seed POIs with their Translations, MenuItems, and QR Codes
            if (!await context.POIs.AnyAsync())
            {
                var pois = GetPoisToSeed();
                await context.POIs.AddRangeAsync(pois);
                await context.SaveChangesAsync();
            }

            // Seed walking tour
            if (!await context.Tours.AnyAsync())
            {
                var tour = new Tour
                {
                    Name = "Vĩnh Khánh Culinary Expedition",
                    Description = "Embark on a mouthwatering journey through Vinh Khanh street, the ultimate street food heaven of District 4.",
                    EstimatedMinutes = 45,
                    DistanceKm = 1.2,
                    IsActive = true,
                    Stops = new List<TourStop>
                    {
                        new TourStop { POIId = 1, StopOrder = 1, TransitionNote = "Start at Ba Lan Broken Rice, then walk 150m south towards Sa Dec Noodle." },
                        new TourStop { POIId = 2, StopOrder = 2, TransitionNote = "After enjoying Sa Dec Noodle, walk 200m further down the road to find Oc Dao seafood paradise." },
                        new TourStop { POIId = 3, StopOrder = 3, TransitionNote = "You have completed the street food trail at Oc Dao Vĩnh Khánh! Enjoy your fresh seafood feast." }
                    }
                };

                await context.Tours.AddAsync(tour);
                await context.SaveChangesAsync();
            }

            // Seed Quizzes
            if (!await context.QuizQuestions.AnyAsync())
            {
                var quiz1 = new QuizQuestion
                {
                    POIId = 1,
                    QuestionText = "Món sườn nướng tại Cơm Tấm Bà Lan được ướp theo hương vị đặc trưng nào?",
                    AnswerA = "Chua ngọt với mật ong",
                    AnswerB = "Mặn ngọt caramen với sả và tỏi nướng",
                    AnswerC = "Cay nồng với sa tế ớt Trung Hoa",
                    AnswerD = "Vị ngũ vị hương truyền thống",
                    CorrectOption = 'B',
                    ExplanationText = "Sườn nướng tại đây được tẩm ướp bằng sả tươi giã nhuyễn và tỏi nướng caramen giúp tạo nên mùi thơm nồng nàn đặc trưng của ẩm thực Nam Bộ.",
                    Translations = new List<QuizQuestionTranslation>
                    {
                        new QuizQuestionTranslation
                        {
                            LanguageCode = "en",
                            QuestionText = "What characterizes the marinade of the grilled pork chops at Ba Lan Broken Rice?",
                            AnswerA = "Sweet and sour honey glaze",
                            AnswerB = "Caramelized savory-sweet garlic and lemongrass",
                            AnswerC = "Spicy Sichuan chili paste",
                            AnswerD = "Traditional five-spice blend",
                            ExplanationText = "The pork chops are marinated with freshly crushed lemongrass and caramelized garlic, creating the signature rich aroma of Southern Vietnamese cuisine."
                        }
                    }
                };

                var quiz2 = new QuizQuestion
                {
                    POIId = 3,
                    QuestionText = "Món ăn nào được xem là thương hiệu huyền thoại của Ốc Đào?",
                    AnswerA = "Ốc Hương Xào Bơ Tỏi",
                    AnswerB = "Ốc Mỡ Xào Sa Tế",
                    AnswerC = "Nghêu Hấp Sả",
                    AnswerD = "Sò Lông Nướng Mỡ Hành",
                    CorrectOption = 'A',
                    ExplanationText = "Ốc Hương Xào Bơ Tỏi tại Ốc Đào nổi tiếng nhờ nước sốt bơ tỏi thơm ngậy, sánh đặc ăn kèm bánh mì nóng giòn cực kỳ cuốn.",
                    Translations = new List<QuizQuestionTranslation>
                    {
                        new QuizQuestionTranslation
                        {
                            LanguageCode = "en",
                            QuestionText = "Which dish is considered the legendary signature of Oc Dao?",
                            AnswerA = "Sweet Snails stir-fried with Garlic Butter",
                            AnswerB = "Mud Snails in Spicy Satay Sauce",
                            AnswerC = "Steamed Clams with Lemongrass",
                            AnswerD = "Grilled Scallops with Spring Onion Oil",
                            ExplanationText = "Oc Huong stir-fried with garlic butter at Oc Dao is legendary for its rich, aromatic sauce, best enjoyed by dipping crispy hot bread."
                        }
                    }
                };

                await context.QuizQuestions.AddRangeAsync(quiz1, quiz2);
                await context.SaveChangesAsync();
            }
        }

        private static List<POI> GetPoisToSeed()
        {
            var list = new List<POI>();

            // 1. Cơm Tấm Bà Lan
            var comTam = new POI
            {
                Name = "Cơm Tấm Bà Lan",
                Slug = "com-tam-ba-lan",
                Latitude = 10.7575,
                Longitude = 106.7020,
                TriggerRadiusMeters = 25,
                Category = "restaurant",
                Priority = 8,
                ImageUrl = "/images/pois/com-tam-ba-lan.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7575,106.7020",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            comTam.Translations.Add(new POITranslation
            {
                LanguageCode = "en",
                Name = "Ba Lan Broken Rice",
                ShortDescription = "Famous broken rice stall since 1995.",
                FullDescription = "Ba Lan Broken Rice is one of the most iconic culinary destinations on Vinh Khanh street. Serving generations of locals and tourists, it is renowned for its perfectly caramelized grilled pork chops, savory egg meatloaf, and signature sweet-and-sour fish sauce.",
                AudioText = "Welcome to Ba Lan Broken Rice, a legendary street food stall open since 1995. You are standing in front of one of the most famous broken rice spots in District 4. We highly recommend trying the classic Cơm Tấm Sườn Bì Chả, featuring charcoal-grilled pork chops marinated in a secret family recipe."
            });
            comTam.QRCodes.Add(new QRCode { Code = "VKE-POI-001", QRImageUrl = "/qrcodes/VKE-POI-001.png" });
            comTam.MenuItems.Add(new MenuItem
            {
                Name = "Cơm Tấm Sườn Nướng",
                Price = 45000,
                SortOrder = 1,
                Translations = new List<MenuItemTranslation>
                {
                    new MenuItemTranslation { LanguageCode = "en", Name = "Broken Rice with Grilled Pork Chop", Description = "Succulent charcoal-grilled pork chop served over broken rice." }
                }
            });
            comTam.MenuItems.Add(new MenuItem
            {
                Name = "Cơm Tấm Sườn Bì Chả",
                Price = 55000,
                SortOrder = 2,
                Translations = new List<MenuItemTranslation>
                {
                    new MenuItemTranslation { LanguageCode = "en", Name = "Broken Rice Combo", Description = "Broken rice topped with grilled pork chop, shredded pork skin, and steamed egg meatloaf." }
                }
            });
            comTam.MenuItems.Add(new MenuItem
            {
                Name = "Cơm Tấm Đùi Gà Nướng",
                Price = 50000,
                SortOrder = 3,
                Translations = new List<MenuItemTranslation>
                {
                    new MenuItemTranslation { LanguageCode = "en", Name = "Broken Rice with Grilled Chicken Drumstick", Description = "Crispy, juicy grilled chicken drumstick served over fragrant broken rice." }
                }
            });
            list.Add(comTam);

            // 2. Hủ Tiếu Sa Đéc
            var huTieu = new POI
            {
                Name = "Hủ Tiếu Sa Đéc",
                Slug = "hu-tieu-sa-dec",
                Latitude = 10.7579,
                Longitude = 106.7015,
                TriggerRadiusMeters = 25,
                Category = "restaurant",
                Priority = 7,
                ImageUrl = "/images/pois/hu-tieu-sa-dec.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7579,106.7015",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            huTieu.Translations.Add(new POITranslation
            {
                LanguageCode = "en",
                Name = "Sa Dec Noodle Soup",
                ShortDescription = "Traditional chewy noodles in rich pork broth.",
                FullDescription = "Originating from Sa Dec city in the Mekong Delta, this noodle stall features unique chewy tapioca noodles, topped with fresh shrimp, lean pork slices, quail eggs, and a deeply flavorful bone broth slow-simmered for 12 hours.",
                AudioText = "Welcome to Sa Dec Noodle Soup. This culinary style brings the authentic taste of the Mekong Delta to Saigon. The secret lies in the special rice noodles which are exceptionally chewy and don't get soggy, paired with a sweet pork-bone broth."
            });
            huTieu.QRCodes.Add(new QRCode { Code = "VKE-POI-002", QRImageUrl = "/qrcodes/VKE-POI-002.png" });
            huTieu.MenuItems.Add(new MenuItem
            {
                Name = "Hủ Tiếu Khô Sa Đéc",
                Price = 40000,
                SortOrder = 1,
                Translations = new List<MenuItemTranslation>
                {
                    new MenuItemTranslation { LanguageCode = "en", Name = "Dry Sa Dec Noodles", Description = "Chewy noodles tossed in dark savory soy sauce, served with broth on the side." }
                }
            });
            huTieu.MenuItems.Add(new MenuItem
            {
                Name = "Hủ Tiếu Nước Đặc Biệt",
                Price = 50000,
                SortOrder = 2,
                Translations = new List<MenuItemTranslation>
                {
                    new MenuItemTranslation { LanguageCode = "en", Name = "Special Noodle Soup", Description = "Noodle soup topped with shrimp, pork slices, minced pork, and quail eggs in hot broth." }
                }
            });
            list.Add(huTieu);

            // 3. Ốc Đào
            var ocDao = new POI
            {
                Name = "Ốc Đào Vĩnh Khánh",
                Slug = "oc-dao-vinh-khanh",
                Latitude = 10.7565,
                Longitude = 106.7030,
                TriggerRadiusMeters = 30,
                Category = "restaurant",
                Priority = 9,
                ImageUrl = "/images/pois/oc-dao.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7565,106.7030",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            ocDao.Translations.Add(new POITranslation
            {
                LanguageCode = "en",
                Name = "Oc Dao Snail Restaurant",
                ShortDescription = "Saigon's premier fresh snail and seafood eatery.",
                FullDescription = "Oc Dao is the most famous snail restaurant in District 4, offering a massive variety of fresh snails, clams, and crabs prepared in different mouth-watering styles such as salted egg sauce, garlic butter stir-fry, and lemongrass steam.",
                AudioText = "Welcome to Oc Dao Vĩnh Khánh, a paradise for seafood lovers. Eating snails or 'Ăn Ốc' is a fundamental social and culinary ritual in Saigon. We recommend ordering the grilled scallops with spring onion oil, and sweet snails stir-fried in rich garlic butter."
            });
            ocDao.QRCodes.Add(new QRCode { Code = "VKE-POI-003", QRImageUrl = "/qrcodes/VKE-POI-003.png" });
            ocDao.MenuItems.Add(new MenuItem
            {
                Name = "Ốc Hương Xào Bơ Tỏi",
                Price = 80000,
                SortOrder = 1,
                Translations = new List<MenuItemTranslation>
                {
                    new MenuItemTranslation { LanguageCode = "en", Name = "Sweet Snails in Garlic Butter", Description = "Spotted sweet snails stir-fried in aromatic garlic butter sauce, perfect for dipping bread." }
                }
            });
            ocDao.MenuItems.Add(new MenuItem
            {
                Name = "Sò Điệp Nướng Mỡ Hành",
                Price = 75000,
                SortOrder = 2,
                Translations = new List<MenuItemTranslation>
                {
                    new MenuItemTranslation { LanguageCode = "en", Name = "Grilled Scallops with Green Onion Oil", Description = "Fresh scallops grilled on charcoal, topped with scallion oil and crushed roasted peanuts." }
                }
            });
            ocDao.MenuItems.Add(new MenuItem
            {
                Name = "Nghêu Hấp Sả",
                Price = 60000,
                SortOrder = 3,
                Translations = new List<MenuItemTranslation>
                {
                    new MenuItemTranslation { LanguageCode = "en", Name = "Lemongrass Steamed Clams", Description = "Fresh baby clams steamed with lemongrass, chili, and sweet basil broth." }
                }
            });
            list.Add(ocDao);

            // 4. Café Vĩnh Khánh
            var cafeVK = new POI
            {
                Name = "Café Vĩnh Khánh",
                Slug = "cafe-vinh-khanh",
                Latitude = 10.7568,
                Longitude = 106.7021,
                TriggerRadiusMeters = 20,
                Category = "cafe",
                Priority = 6,
                ImageUrl = "/images/pois/cafe-vinh-khanh.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7568,106.7021",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            cafeVK.Translations.Add(new POITranslation
            {
                LanguageCode = "en",
                Name = "Vinh Khanh Coffee Corner",
                ShortDescription = "Charming sidewalk cafe serving traditional Vietnamese coffee.",
                FullDescription = "A typical street-style coffee shop where you can sit on small plastic stools, observe local life, and enjoy strong, slow-dripped Vietnamese Robusta coffee mixed with sweet condensed milk over ice.",
                AudioText = "Welcome to Vinh Khanh Coffee Corner. Sit down and experience the local street culture. Vietnamese coffee is exceptionally strong and fragrant. Don't miss out on trying Cà phê sữa đá, the iconic Vietnamese iced milk coffee."
            });
            cafeVK.QRCodes.Add(new QRCode { Code = "VKE-POI-004", QRImageUrl = "/qrcodes/VKE-POI-004.png" });
            list.Add(cafeVK);

            // 5. Chùa Vĩnh Khánh
            var chuaVK = new POI
            {
                Name = "Chùa Vĩnh Khánh",
                Slug = "chua-vinh-khanh",
                Latitude = 10.7558,
                Longitude = 106.7010,
                TriggerRadiusMeters = 40,
                Category = "temple",
                Priority = 9,
                ImageUrl = "/images/pois/chua-vinh-khanh.jpg",
                GoogleMapsUrl = "https://maps.google.com/?q=10.7558,106.7010",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            chuaVK.Translations.Add(new POITranslation
            {
                LanguageCode = "en",
                Name = "Vinh Khanh Pagoda",
                ShortDescription = "Historic Buddhist pagoda offering a serene escape.",
                FullDescription = "Built in the mid-20th century, Vinh Khanh Pagoda stands as a beautiful spiritual landmark amidst the buzzing street food hub. It features detailed East Asian temple architecture, decorated with intricate statues and incense altars.",
                AudioText = "You are standing near Vinh Khanh Pagoda, a peaceful sanctuary in the heart of District 4. It offers a stark, beautiful contrast to the busy food stalls surrounding it. Take a moment to appreciate the classical architecture and spiritual calm."
            });
            chuaVK.QRCodes.Add(new QRCode { Code = "VKE-POI-005", QRImageUrl = "/qrcodes/VKE-POI-005.png" });
            list.Add(chuaVK);

            // Seed remaining POIs (6 to 15) to hit the 15 POIs seed target
            string[] names = { "Chợ Vĩnh Khánh", "Công Viên Kênh Tẻ", "Hẻm Ẩm Thực 135", "Street Art Wall", "Bún Bò Huế Cô Ba", "Xe Nước Mía Sạch", "Cầu Kênh Tẻ", "Bến Xe Buýt Vĩnh Khánh", "Tiệm Tạp Hóa Cô Út", "Bánh Mì Kẹp Sài Gòn" };
            string[] slugs = { "cho-vinh-khanh", "cong-vien-kenh-te", "hem-am-thuc-135", "street-art-wall", "bun-bo-hue-co-ba", "xe-nuoc-mia-sach", "cau-kenh-te", "ben-xe-buyt-vinh-khanh", "tiem-tap-hoa-co-ut", "banh-mi-kep-sai-gon" };
            string[] categories = { "market", "park", "street_food", "street_art", "restaurant", "cafe", "landmark", "landmark", "landmark", "restaurant" };
            double[] lats = { 10.7555, 10.7545, 10.7572, 10.7562, 10.7580, 10.7570, 10.7540, 10.7585, 10.7560, 10.7582 };
            double[] lngs = { 106.7035, 106.7040, 106.7018, 106.7028, 106.7032, 106.7012, 106.7005, 106.7008, 106.7016, 106.7025 };
            int[] priorities = { 8, 7, 8, 6, 8, 5, 7, 4, 6, 8 };
            string[] enNames = { "Vinh Khanh Local Market", "Kenh Te Canal Park", "Food Alley 135", "Urban Art Wall", "Co Ba Hue Beef Noodles", "Fresh Sugarcane Juice Cart", "Kenh Te Bridge", "Vinh Khanh Bus Stop", "Co Ut Heritage Grocery", "Saigon Classic Banh Mi" };
            string[] enShorts = { "Traditional wet market.", "Waterfront green park.", "Hidden culinary alleyway.", "Vibrant local graffiti.", "Spicy lemongrass beef noodles.", "Sweet pressed sugarcane juice.", "Historical bridge landmark.", "Transit hub with QR codes.", "Classic family-owned store.", "World-famous crispy baguettes." };

            for (int i = 0; i < 10; i++)
            {
                var poi = new POI
                {
                    Name = names[i],
                    Slug = slugs[i],
                    Latitude = lats[i],
                    Longitude = lngs[i],
                    TriggerRadiusMeters = 30,
                    Category = categories[i],
                    Priority = priorities[i],
                    ImageUrl = $"/images/pois/{slugs[i]}.jpg",
                    GoogleMapsUrl = $"https://maps.google.com/?q={lats[i]},{lngs[i]}",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                poi.Translations.Add(new POITranslation
                {
                    LanguageCode = "en",
                    Name = enNames[i],
                    ShortDescription = enShorts[i],
                    FullDescription = $"{enNames[i]} is an essential part of the vibrant landscape on Vinh Khanh street, highly loved by both local residents and curious international explorers.",
                    AudioText = $"You are close to {enNames[i]}. {enShorts[i]} It is highly recommended to explore this spot and experience the authentic local lifestyle."
                });

                int index = i + 6;
                string qrCode = $"VKE-POI-{index:D3}";
                poi.QRCodes.Add(new QRCode { Code = qrCode, QRImageUrl = $"/qrcodes/{qrCode}.png" });

                if (categories[i] == "restaurant")
                {
                    poi.MenuItems.Add(new MenuItem
                    {
                        Name = names[i] + " Món Chính",
                        Price = 45000,
                        SortOrder = 1,
                        Translations = new List<MenuItemTranslation>
                        {
                            new MenuItemTranslation { LanguageCode = "en", Name = enNames[i] + " Signature Dish", Description = "Must-try specialty of the establishment." }
                        }
                    });
                }

                list.Add(poi);
            }

            return list;
        }
    }
}
