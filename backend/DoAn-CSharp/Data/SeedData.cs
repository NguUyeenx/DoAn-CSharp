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
                var tours = new[]
                {
                    new Tour
                    {
                        Name = "Seafood Discovery Tour",
                        Description = "Tuyến tham quan dành cho du khách muốn khám phá văn hóa hải sản đường phố đặc trưng của Quận 4 với các món ốc, sò, cua, ghẹ và hải sản tươi sống.",
                        EstimatedMinutes = 90,
                        DistanceKm = 0.8,
                        IsActive = true,
                        Stops = new List<TourStop>
                        {
                            new TourStop { POIId = 1, StopOrder = 1, TransitionNote = "Đi bộ 120m về hướng Bắc đến Ốc Đào." },
                            new TourStop { POIId = 2, StopOrder = 2, TransitionNote = "Tiếp tục đi bộ 150m đến Ốc Vũ." },
                            new TourStop { POIId = 4, StopOrder = 3, TransitionNote = "Đi bộ 200m đến Hải Sản Biển Ngọc." },
                            new TourStop { POIId = 9, StopOrder = 4, TransitionNote = "Đi thêm 180m để đến Ốc Đêm Vĩnh Khánh." },
                            new TourStop { POIId = 10, StopOrder = 5, TransitionNote = "Kết thúc hành trình khám phá hải sản." }
                        }
                    },
                    new Tour
                    {
                        Name = "Best Of Vĩnh Khánh",
                        Description = "Tuyến tham quan tổng hợp những món ăn nổi bật nhất tại khu phố Vĩnh Khánh từ hải sản, món nướng, món Việt cho đến cà phê thư giãn.",
                        EstimatedMinutes = 120,
                        DistanceKm = 1.2,
                        IsActive = true,
                        Stops = new List<TourStop>
                        {
                            new TourStop { POIId = 1, StopOrder = 1, TransitionNote = "Di chuyển 250m đến Quán Nhậu Tự Do." },
                            new TourStop { POIId = 12, StopOrder = 2, TransitionNote = "Đi bộ 180m đến Bò Nướng Vĩnh Khánh." },
                            new TourStop { POIId = 15, StopOrder = 3, TransitionNote = "Đi tiếp 120m đến Bún Thái Hải Sản Vĩnh Khánh." },
                            new TourStop { POIId = 18, StopOrder = 4, TransitionNote = "Đi thêm 220m đến Cafe Vĩnh Khánh Corner." },
                            new TourStop { POIId = 19, StopOrder = 5, TransitionNote = "Thư giãn và kết thúc tour tại quán cà phê." }
                        }
                    },
                    new Tour
                    {
                        Name = "Vĩnh Khánh By Night",
                        Description = "Trải nghiệm không khí náo nhiệt của phố ẩm thực về đêm, thưởng thức các món ăn nóng hổi và kết thúc bằng một ly cà phê thư giãn.",
                        EstimatedMinutes = 150,
                        DistanceKm = 1.5,
                        IsActive = true,
                        Stops = new List<TourStop>
                        {
                            new TourStop { POIId = 10, StopOrder = 1, TransitionNote = "Đi bộ 150m đến Ốc Phát." },
                            new TourStop { POIId = 6, StopOrder = 2, TransitionNote = "Di chuyển 300m đến Thế Giới Bò." },
                            new TourStop { POIId = 14, StopOrder = 3, TransitionNote = "Đi tiếp 200m đến Thuận Việt BBQ & Hotpot." },
                            new TourStop { POIId = 13, StopOrder = 4, TransitionNote = "Đi bộ 450m đến Riverside Coffee Q4." },
                            new TourStop { POIId = 20, StopOrder = 5, TransitionNote = "Kết thúc hành trình ẩm thực đêm." }
                        }
                    },
                    new Tour
                    {
                        Name = "Family & Friends Tour",
                        Description = "Tuyến phù hợp cho gia đình hoặc nhóm đông người với không gian rộng rãi, thực đơn đa dạng và nhiều lựa chọn phù hợp cho mọi lứa tuổi.",
                        EstimatedMinutes = 180,
                        DistanceKm = 1.0,
                        IsActive = true,
                        Stops = new List<TourStop>
                        {
                            new TourStop { POIId = 11, StopOrder = 1, TransitionNote = "Đi bộ 180m đến Hải Sản Biển Ngọc." },
                            new TourStop { POIId = 9, StopOrder = 2, TransitionNote = "Di chuyển 280m đến Thuận Việt BBQ & Hotpot." },
                            new TourStop { POIId = 13, StopOrder = 3, TransitionNote = "Đi tiếp 240m đến Bánh Xèo Miền Tây." },
                            new TourStop { POIId = 17, StopOrder = 4, TransitionNote = "Đi thêm 300m đến Riverside Coffee Q4." },
                            new TourStop { POIId = 20, StopOrder = 5, TransitionNote = "Kết thúc buổi họp mặt gia đình." }
                        }
                    },
                    new Tour
                    {
                        Name = "Hương Vị Việt Nam",
                        Description = "Khám phá những món ăn mang đậm bản sắc Việt Nam từ miền Trung đến miền Tây Nam Bộ.",
                        EstimatedMinutes = 120,
                        DistanceKm = 0.9,
                        IsActive = true,
                        Stops = new List<TourStop>
                        {
                            new TourStop { POIId = 16, StopOrder = 1, TransitionNote = "Đi bộ 260m đến Bún Thái Hải Sản Vĩnh Khánh." },
                            new TourStop { POIId = 18, StopOrder = 2, TransitionNote = "Đi bộ 220m đến Bánh Xèo Miền Tây." },
                            new TourStop { POIId = 17, StopOrder = 3, TransitionNote = "Di chuyển 350m đến Lãng Restaurant." },
                            new TourStop { POIId = 11, StopOrder = 4, TransitionNote = "Kết thúc hành trình khám phá ẩm thực Việt." }
                        }
                    },
                    new Tour
                    {
                        Name = "Coffee Explorer",
                        Description = "Tuyến tham quan nhẹ nhàng dành cho du khách muốn nghỉ ngơi, chụp ảnh và thưởng thức đồ uống trong không gian thư giãn.",
                        EstimatedMinutes = 60,
                        DistanceKm = 0.5,
                        IsActive = true,
                        Stops = new List<TourStop>
                        {
                            new TourStop { POIId = 19, StopOrder = 1, TransitionNote = "Đi bộ 500m dọc bờ sông đến Riverside Coffee Q4." },
                            new TourStop { POIId = 20, StopOrder = 2, TransitionNote = "Thư giãn ngắm cảnh và kết thúc tour." }
                        }
                    }
                };
                await context.Tours.AddRangeAsync(tours);
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
                PriceRange = "2",
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
            poi0.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Oanh", ShortDescription = "Một trong những quán ốc nổi tiếng nhất khu phố ẩm thực Vĩnh Khánh, thu hút thực khách bởi hải sản tươi ngon và không khí sôi động về đêm.", FullDescription = "Ốc Oanh là địa điểm quen thuộc đối với những tín đồ hải sản khi ghé thăm Quận 4. Quán nổi tiếng với thực đơn đa dạng gồm nhiều loại ốc, sò, nghêu, hàu và các món hải sản nướng hấp dẫn. Không gian bình dân nhưng luôn đông khách, đặc biệt vào buổi tối. Đây là nơi du khách có thể cảm nhận rõ nét văn hóa ẩm thực đường phố đặc trưng của Thành phố Hồ Chí Minh.", AudioText = "Chào mừng bạn đến với Ốc Oanh, một trong những địa điểm nổi bật nhất trên tuyến phố ẩm thực Vĩnh Khánh. Nơi đây từ lâu đã trở thành điểm hẹn quen thuộc của người dân địa phương và du khách yêu thích hải sản. Thực đơn phong phú cùng nguyên liệu tươi sống được chế biến ngay tại chỗ đã giúp quán xây dựng được danh tiếng riêng. Khi ngồi thưởng thức các món ăn nóng hổi giữa không khí nhộn nhịp của khu phố về đêm, bạn sẽ cảm nhận được nét đặc sắc của văn hóa ẩm thực Sài Gòn." });
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
                PriceRange = "2",
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
            poi1.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Đào", ShortDescription = "Quán hải sản nổi tiếng với các món ốc được chế biến cùng nhiều loại nước sốt đặc trưng.", FullDescription = "Ốc Đào được nhiều thực khách biết đến nhờ những công thức nước sốt độc đáo kết hợp cùng hải sản tươi ngon. Các món ăn tại đây mang hương vị đậm đà và hấp dẫn, phù hợp với nhiều khẩu vị khác nhau.", AudioText = "Ốc Đào là một trong những cái tên quen thuộc của khu phố ẩm thực Vĩnh Khánh. Điểm đặc biệt của quán nằm ở các loại nước sốt được chế biến theo công thức riêng, tạo nên hương vị khó quên cho thực khách. Bên cạnh các món ốc truyền thống, quán còn phục vụ nhiều món hải sản đa dạng, góp phần tạo nên sức hút riêng cho địa điểm này." });
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
                PriceRange = "1",
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
            poi2.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Sáu Nở", ShortDescription = "Quán hải sản bình dân với phong cách phục vụ gần gũi và giá cả hợp lý.", FullDescription = "Ốc Sáu Nở là điểm đến quen thuộc của nhiều người dân địa phương. Quán nổi bật với thực đơn hải sản phong phú, nguyên liệu tươi sống và không gian giản dị mang đậm nét văn hóa ăn uống đường phố.", AudioText = "Nếu bạn muốn trải nghiệm một quán hải sản mang đậm phong cách địa phương, Ốc Sáu Nở là lựa chọn phù hợp. Không gian tuy không quá cầu kỳ nhưng luôn tạo cảm giác thân thiện và gần gũi. Các món ăn được chế biến nhanh chóng từ nguồn nguyên liệu tươi ngon, mang đến trải nghiệm ẩm thực chân thực và đáng nhớ cho du khách." });
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
                PriceRange = "1",
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
            poi3.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Vũ", ShortDescription = "Nổi tiếng với các món ốc rang muối ớt và hương vị cay nồng đặc trưng.", FullDescription = "Ốc Vũ là địa điểm dành cho những thực khách yêu thích các món ăn đậm vị. Những món hải sản rang muối, nướng hoặc xào cay tại đây luôn nhận được nhiều đánh giá tích cực.", AudioText = "Ốc Vũ mang đến trải nghiệm ẩm thực mạnh mẽ với các món ăn có hương vị đậm đà và cay nồng. Đây là địa điểm được nhiều bạn trẻ yêu thích nhờ phong cách chế biến độc đáo và không khí sôi động. Những món hải sản nóng hổi được phục vụ liên tục đã góp phần tạo nên thương hiệu riêng của quán trong khu vực Vĩnh Khánh." });
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
                PriceRange = "1",
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
            poi4.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Thảo", ShortDescription = "Địa chỉ hải sản quen thuộc với người dân địa phương và khách du lịch.", FullDescription = "Ốc Thảo sở hữu thực đơn đa dạng với nhiều loại ốc và hải sản được chế biến theo phong cách miền Nam. Giá cả hợp lý và chất lượng ổn định là điểm mạnh của quán.", AudioText = "Ốc Thảo là một trong những địa điểm góp phần tạo nên danh tiếng cho phố ẩm thực Vĩnh Khánh. Không gian bình dân, thực đơn phong phú và phong cách phục vụ thân thiện đã giúp quán trở thành điểm đến quen thuộc của nhiều thực khách. Đây là nơi lý tưởng để khám phá hương vị hải sản đường phố đặc trưng của Quận 4." });
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
                PriceRange = "1",
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
            poi5.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Phát", ShortDescription = "Quán ốc lâu năm nổi bật với phong cách phục vụ nhanh chóng và nhiệt tình.", FullDescription = "Ốc Phát mang đến trải nghiệm ẩm thực bình dân với nhiều món ăn quen thuộc được chế biến từ hải sản tươi sống. Không khí nhộn nhịp về đêm là một trong những điểm hấp dẫn của quán.", AudioText = "Ốc Phát là minh chứng cho nét văn hóa ẩm thực bình dân đặc trưng của Sài Gòn. Quán luôn tấp nập thực khách vào mỗi buổi tối, tạo nên khung cảnh sôi động và đầy sức sống. Những món ăn nóng hổi được phục vụ nhanh chóng giúp thực khách có được trải nghiệm trọn vẹn khi ghé thăm khu phố Vĩnh Khánh." });
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
                PriceRange = "1",
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
            poi6.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Tô", ShortDescription = "Địa chỉ quen thuộc của những người yêu thích hải sản nướng và các món ăn đậm vị.", FullDescription = "Ốc Tô nổi bật với các món nướng được chế biến trực tiếp trên bếp than, mang đến hương thơm hấp dẫn và trải nghiệm ẩm thực đặc sắc.", AudioText = "Tại Ốc Tô, thực khách có thể thưởng thức nhiều món hải sản nướng thơm lừng được chế biến ngay khi gọi món. Mùi thơm từ bếp than hòa cùng không khí náo nhiệt của khu phố tạo nên một trải nghiệm khó quên. Đây là địa điểm lý tưởng để khám phá nét đặc sắc của ẩm thực đường phố Quận 4." });
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
                PriceRange = "1",
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
            poi7.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Cúc", ShortDescription = "Quán hải sản gia đình với thực đơn phong phú và không gian gần gũi.", FullDescription = "Ốc Cúc phục vụ nhiều món ăn từ ốc, sò và các loại hải sản tươi sống khác. Quán được nhiều thực khách lựa chọn cho các buổi gặp gỡ gia đình hoặc bạn bè.", AudioText = "Ốc Cúc mang đến cảm giác thân thiện và gần gũi như một bữa cơm gia đình. Thực đơn đa dạng cùng cách chế biến đậm chất miền Nam giúp quán luôn giữ được lượng khách ổn định. Đây là địa điểm phù hợp cho những ai muốn thưởng thức hải sản trong không gian thoải mái và ấm cúng." });
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
                PriceRange = "2",
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
            poi8.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Hải Sản Biển Ngọc", ShortDescription = "Nhà hàng hải sản rộng rãi với nhiều loại hải sản tươi sống được lựa chọn trực tiếp.", FullDescription = "Biển Ngọc là địa điểm phù hợp cho các buổi liên hoan, gặp mặt gia đình hoặc tiếp khách. Nhà hàng nổi bật với không gian lớn và thực đơn hải sản phong phú.", AudioText = "Hải Sản Biển Ngọc mang đến trải nghiệm thưởng thức hải sản theo phong cách nhà hàng hiện đại. Thực khách có thể trực tiếp lựa chọn nguyên liệu từ khu vực trưng bày trước khi đầu bếp chế biến theo yêu cầu. Với không gian rộng rãi và chất lượng phục vụ chuyên nghiệp, đây là một trong những địa điểm nổi bật của khu vực Vĩnh Khánh." });
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
                PriceRange = "1",
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
            poi9.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Ốc Đêm Vĩnh Khánh", ShortDescription = "Điểm đến lý tưởng cho những thực khách yêu thích khám phá ẩm thực đêm của Quận 4.", FullDescription = "Ốc Đêm Vĩnh Khánh phục vụ nhiều món hải sản hấp dẫn đến khuya, đáp ứng nhu cầu ăn uống và giải trí của du khách khi khám phá thành phố về đêm.", AudioText = "Khi màn đêm buông xuống, khu phố Vĩnh Khánh trở nên sôi động hơn bao giờ hết và Ốc Đêm Vĩnh Khánh là một trong những điểm nhấn nổi bật của khu vực này. Không gian nhộn nhịp, ánh đèn rực rỡ cùng những món hải sản thơm ngon đã tạo nên sức hút riêng cho địa điểm. Đây là nơi thích hợp để kết thúc một ngày khám phá thành phố bằng trải nghiệm ẩm thực đường phố đầy màu sắc." });
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
                PriceRange = "3",
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
            poi10.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Lãng Restaurant", ShortDescription = "Nhà hàng mang phong cách ẩm thực Việt hiện đại, kết hợp không gian ấm cúng cùng các món ăn truyền thống được chế biến tinh tế.", FullDescription = "Lãng Restaurant là điểm đến phù hợp cho những thực khách muốn thưởng thức các món ăn Việt Nam trong không gian sang trọng nhưng vẫn giữ được nét gần gũi. Nhà hàng phục vụ nhiều món đặc sản ba miền được chế biến từ nguồn nguyên liệu tươi ngon, mang đến trải nghiệm ẩm thực hài hòa giữa truyền thống và hiện đại.", AudioText = "Lãng Restaurant là một trong những địa điểm nổi bật của khu vực Vĩnh Khánh dành cho những ai yêu thích ẩm thực Việt Nam. Không gian được thiết kế theo phong cách hiện đại nhưng vẫn giữ được sự ấm cúng và thân thiện. Thực đơn của nhà hàng tập trung vào các món ăn truyền thống được chế biến và trình bày tinh tế, phù hợp cho các buổi gặp mặt gia đình, bạn bè hoặc tiếp khách. Đây là nơi du khách có thể cảm nhận được sự giao thoa giữa nét đẹp văn hóa ẩm thực Việt Nam và phong cách phục vụ chuyên nghiệp của một nhà hàng hiện đại." });
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
                PriceRange = "2",
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
            poi11.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Quán Nhậu Tự Do", ShortDescription = "Địa điểm gặp gỡ quen thuộc của người dân địa phương với thực đơn phong phú và không khí sôi động.", FullDescription = "Quán Nhậu Tự Do nổi bật với các món ăn chế biến từ hải sản, thịt nướng và nhiều món nhậu truyền thống. Không gian rộng rãi cùng phong cách phục vụ thân thiện giúp quán luôn đông khách vào buổi tối.", AudioText = "Quán Nhậu Tự Do là nơi phản ánh rõ nét văn hóa gặp gỡ và giao lưu của người dân Sài Gòn. Mỗi buổi tối, quán trở nên nhộn nhịp với những nhóm bạn bè, đồng nghiệp và gia đình cùng nhau thưởng thức các món ăn hấp dẫn. Thực đơn đa dạng từ hải sản, thịt nướng đến các món ăn dân dã giúp thực khách có nhiều lựa chọn phù hợp với khẩu vị. Không khí vui vẻ và cởi mở đã biến nơi đây thành một phần quen thuộc trong đời sống ẩm thực của khu vực Vĩnh Khánh." });
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
                PriceRange = "2",
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
            poi12.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Thuận Việt BBQ & Hotpot", ShortDescription = "Nhà hàng chuyên các món nướng và lẩu với thực đơn phong phú, phù hợp cho các buổi tụ họp đông người.", FullDescription = "Thuận Việt BBQ & Hotpot mang đến trải nghiệm ẩm thực kết hợp giữa các món nướng thơm ngon và nhiều loại nước lẩu hấp dẫn. Không gian hiện đại và rộng rãi thích hợp cho gia đình và nhóm bạn.", AudioText = "Thuận Việt BBQ & Hotpot là điểm đến lý tưởng cho những ai yêu thích các món nướng và lẩu. Nhà hàng phục vụ đa dạng các loại thịt bò, thịt heo, hải sản và rau củ tươi ngon để thực khách tự tay chế biến ngay tại bàn. Bên cạnh đó, các loại nước lẩu đậm đà được nấu theo nhiều hương vị khác nhau giúp bữa ăn trở nên phong phú hơn. Với không gian rộng rãi và phong cách phục vụ chuyên nghiệp, nơi đây thường được lựa chọn cho các buổi liên hoan, sinh nhật hoặc họp mặt gia đình." });
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
                PriceRange = "2",
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
            poi13.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Thế Giới Bò", ShortDescription = "Nhà hàng chuyên các món bò được chế biến theo nhiều phong cách khác nhau, từ nướng, áp chảo đến lẩu.", FullDescription = "Thế Giới Bò là địa điểm dành cho những thực khách yêu thích thịt bò chất lượng cao. Thực đơn đa dạng cùng không gian trẻ trung giúp nơi đây trở thành điểm hẹn quen thuộc của nhiều bạn trẻ.", AudioText = "Thế Giới Bò mang đến cho thực khách cơ hội khám phá nhiều hương vị khác nhau từ thịt bò. Các món ăn được chế biến từ nguồn nguyên liệu được tuyển chọn kỹ lưỡng, kết hợp với nhiều loại sốt và gia vị đặc trưng. Từ bò nướng, bò áp chảo cho đến lẩu bò nóng hổi, mỗi món ăn đều mang một nét hấp dẫn riêng. Đây là địa điểm phù hợp cho những ai muốn trải nghiệm các món ăn giàu dinh dưỡng trong không gian hiện đại và năng động." });
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
                PriceRange = "2",
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
            poi14.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Bò Nướng Vĩnh Khánh", ShortDescription = "Địa điểm nổi tiếng với các món bò nướng thơm lừng trên bếp than hồng.", FullDescription = "Bò Nướng Vĩnh Khánh mang đến trải nghiệm thưởng thức thịt bò nướng theo phong cách truyền thống. Hương thơm từ bếp than và các loại gia vị đặc trưng luôn thu hút đông đảo thực khách.", AudioText = "Bò Nướng Vĩnh Khánh là điểm đến hấp dẫn đối với những người yêu thích các món nướng. Những miếng thịt bò được tẩm ướp kỹ lưỡng trước khi nướng trên bếp than hồng, tạo nên mùi thơm quyến rũ lan tỏa khắp không gian. Khi thưởng thức cùng rau sống, bánh tráng và nước chấm đặc biệt, thực khách sẽ cảm nhận được sự hài hòa giữa các hương vị. Đây là một trong những địa điểm góp phần làm phong phú thêm bức tranh ẩm thực của khu phố Vĩnh Khánh." });
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
                PriceRange = "1",
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
            poi15.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Nem Nướng Quê Nhà", ShortDescription = "Quán ăn mang đậm hương vị truyền thống với các món nem nướng và đặc sản miền Trung.", FullDescription = "Nem Nướng Quê Nhà nổi tiếng với các phần nem nướng thơm ngon được phục vụ cùng bánh hỏi, rau sống và nước chấm đặc trưng. Đây là lựa chọn phù hợp cho những ai muốn thưởng thức món ăn dân dã nhưng đầy hấp dẫn.", AudioText = "Nem Nướng Quê Nhà mang đến hương vị quen thuộc của những món ăn truyền thống Việt Nam. Những xiên nem được nướng vàng đều trên than hồng, tạo nên mùi thơm đặc trưng khiến nhiều thực khách khó cưỡng lại. Khi kết hợp cùng bánh hỏi, rau sống tươi xanh và nước chấm đậm đà, món ăn trở nên hài hòa và hấp dẫn hơn. Đây là địa điểm lý tưởng để khám phá nét đẹp của ẩm thực dân gian trong hành trình trải nghiệm khu phố Vĩnh Khánh." });
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
                PriceRange = "1",
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
            poi16.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Bánh Xèo Miền Tây", ShortDescription = "Quán ăn dân dã nổi tiếng với những chiếc bánh xèo vàng giòn mang đậm hương vị miền Tây Nam Bộ.", FullDescription = "Bánh Xèo Miền Tây phục vụ các phần bánh xèo có kích thước lớn, nhân đầy đặn gồm tôm, thịt và giá đỗ. Món ăn được dùng kèm nhiều loại rau sống đặc trưng.", AudioText = "Bánh Xèo Miền Tây là nơi thực khách có thể cảm nhận rõ nét sự phong phú của ẩm thực vùng sông nước Nam Bộ. Những chiếc bánh xèo được đổ trên chảo nóng với lớp vỏ vàng giòn, bên trong là nhân tôm thịt hấp dẫn. Khi cuốn cùng các loại rau sống và chấm nước mắm chua ngọt, món ăn mang đến hương vị hài hòa và rất dễ thưởng thức. Đây là một trong những món ăn truyền thống được nhiều du khách yêu thích khi đến với khu vực Vĩnh Khánh." });
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
                PriceRange = "1",
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
            poi17.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Bún Thái Hải Sản Vĩnh Khánh", ShortDescription = "Địa điểm nổi tiếng với món bún Thái hải sản có hương vị chua cay đậm đà.", FullDescription = "Bún Thái Hải Sản Vĩnh Khánh phục vụ những tô bún đầy đặn với nhiều loại hải sản tươi ngon như tôm, mực và nghêu. Nước dùng chua cay đặc trưng tạo nên sức hấp dẫn riêng.", AudioText = "Bún Thái Hải Sản Vĩnh Khánh mang đến trải nghiệm ẩm thực kết hợp giữa hương vị Thái Lan và nguyên liệu tươi ngon của vùng biển Việt Nam. Nước dùng có vị chua thanh, cay nhẹ và thơm mùi sả, kết hợp với các loại hải sản như tôm, mực và nghêu tạo nên món ăn đầy màu sắc. Đây là lựa chọn hấp dẫn dành cho những thực khách muốn đổi vị sau khi khám phá các món nướng và hải sản của khu phố Vĩnh Khánh." });
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
                PriceRange = "1",
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
            poi18.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Cafe Vĩnh Khánh Corner", ShortDescription = "Không gian cà phê hiện đại với tầm nhìn hướng ra khu phố ẩm thực nhộn nhịp.", FullDescription = "Cafe Vĩnh Khánh Corner là điểm dừng chân lý tưởng để thư giãn sau hành trình khám phá ẩm thực. Quán phục vụ nhiều loại cà phê, trà và bánh ngọt trong không gian trẻ trung.", AudioText = "Cafe Vĩnh Khánh Corner mang đến cho du khách một góc nhìn khác về khu phố ẩm thực nổi tiếng của Quận 4. Từ không gian quán, thực khách có thể quan sát dòng người tấp nập và cảm nhận nhịp sống sôi động của khu vực. Những ly cà phê thơm ngon, các loại trà thanh mát cùng không gian thoải mái giúp nơi đây trở thành địa điểm nghỉ chân được nhiều người yêu thích sau khi khám phá các món ăn đặc sắc của Vĩnh Khánh." });
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
                PriceRange = "2",
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
            poi19.Translations.Add(new POITranslation { LanguageCode = "vi", Name = "Riverside Coffee Q4", ShortDescription = "Quán cà phê có không gian thoáng đãng, mang đến cảm giác thư giãn giữa lòng thành phố.", FullDescription = "Riverside Coffee Q4 sở hữu vị trí thuận lợi cùng không gian mở gần khu vực kênh rạch, tạo nên bầu không khí dễ chịu và yên tĩnh.", AudioText = "Riverside Coffee Q4 là địa điểm phù hợp cho những ai muốn tìm kiếm sự thư thái sau hành trình khám phá phố ẩm thực Vĩnh Khánh. Không gian mở, nhiều cây xanh cùng làn gió mát từ khu vực ven kênh giúp quán tạo nên cảm giác dễ chịu và khác biệt so với sự náo nhiệt bên ngoài. Đây là nơi lý tưởng để thưởng thức một tách cà phê, trò chuyện cùng bạn bè hoặc đơn giản là tận hưởng những phút giây thư giãn giữa nhịp sống sôi động của Thành phố Hồ Chí Minh." });
            list.Add(poi19);

            return list;
        }
    }
}
