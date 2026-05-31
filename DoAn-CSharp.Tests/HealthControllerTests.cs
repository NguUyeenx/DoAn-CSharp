using Microsoft.AspNetCore.Mvc;
using DoAn_CSharp.Controllers;
using System.Reflection;

namespace DoAn_CSharp.Tests
{
    public class HealthControllerTests
    {
        [Fact]
        public void GetHealth_ReturnsOkWithHealthyStatus()
        {
            // Arrange
            var controller = new HealthController();

            // Act
            var result = controller.GetHealth();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            // Access anonymous type properties
            var value = okResult.Value;
            var statusProp = value.GetType().GetProperty("status");
            var timestampProp = value.GetType().GetProperty("timestamp");

            Assert.NotNull(statusProp);
            Assert.NotNull(timestampProp);

            var status = statusProp.GetValue(value) as string;
            Assert.Equal("Healthy", status);
        }
    }
}
