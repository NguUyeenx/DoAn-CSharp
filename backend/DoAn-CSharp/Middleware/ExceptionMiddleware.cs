using System.Net;
using System.Text.Json;

namespace DoAn_CSharp.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var statusCode = (int)HttpStatusCode.InternalServerError;
            var error = "InternalServerError";

            if (exception is UnauthorizedAccessException)
            {
                statusCode = (int)HttpStatusCode.Unauthorized;
                error = "Unauthorized";
            }
            else if (exception is ArgumentException || exception is KeyNotFoundException)
            {
                statusCode = (int)HttpStatusCode.BadRequest;
                error = "BadRequest";
            }

            context.Response.StatusCode = statusCode;

            var response = new
            {
                error = error,
                message = _env.IsDevelopment() || statusCode != 500 ? exception.Message : "An unexpected error occurred. Please try again later.",
                statusCode = context.Response.StatusCode
            };

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var json = JsonSerializer.Serialize(response, options);

            await context.Response.WriteAsync(json);
        }
    }
}
