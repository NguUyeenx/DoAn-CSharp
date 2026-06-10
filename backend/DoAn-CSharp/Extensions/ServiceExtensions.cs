using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DoAn_CSharp.Data;
using DoAn_CSharp.Services;
using FluentValidation;
using FluentValidation.AspNetCore;

namespace DoAn_CSharp.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Register AppDbContext with SQL Server
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            // Register FluentValidation
            services.AddFluentValidationAutoValidation();
            services.AddValidatorsFromAssembly(typeof(ServiceExtensions).Assembly);

            // Register Application Services
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IPOIService, POIService>();
            services.AddScoped<ITranslationService, TranslationService>();
            services.AddScoped<IQRCodeService, QRCodeService>();
            services.AddScoped<IMenuService, MenuService>();
            services.AddScoped<IAnalyticsService, AnalyticsService>();
            services.AddScoped<ITourService, TourService>();
            services.AddScoped<IQuizService, QuizService>();
            services.AddScoped<IUploadService, UploadService>();
            services.AddScoped<ITTSService, TTSService>();

            // JWT Authentication
            var jwtKey = configuration["Jwt:SecretKey"]
                ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");
            var jwtIssuer = configuration["Jwt:Issuer"] ?? "VinhKhanhExplorer";

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtIssuer,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                    };
                });

            services.AddAuthorization();

            return services;
        }
    }
}
