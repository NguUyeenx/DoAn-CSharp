using Microsoft.EntityFrameworkCore;
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
            services.AddScoped<IPOIService, POIService>();
            services.AddScoped<ITranslationService, TranslationService>();
            services.AddScoped<IQRCodeService, QRCodeService>();
            services.AddScoped<IMenuService, MenuService>();
            services.AddScoped<IAnalyticsService, AnalyticsService>();
            services.AddScoped<ITourService, TourService>();
            services.AddScoped<IQuizService, QuizService>();

            return services;
        }
    }
}
