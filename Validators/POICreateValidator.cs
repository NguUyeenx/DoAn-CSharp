using FluentValidation;
using DoAn_CSharp.Models.DTOs;
using System.Collections.Generic;

namespace DoAn_CSharp.Validators
{
    public class POICreateValidator : AbstractValidator<POICreateDto>
    {
        private static readonly HashSet<string> AllowedCategories = new()
        {
            "restaurant", "cafe", "temple", "market", "park", "landmark", "street_art", "street_food"
        };

        public POICreateValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90.0, 90.0).WithMessage("Latitude must be between -90 and 90.");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180.0, 180.0).WithMessage("Longitude must be between -180 and 180.");

            RuleFor(x => x.TriggerRadiusMeters)
                .InclusiveBetween(5, 500).WithMessage("Trigger radius must be between 5 and 500 meters.");

            RuleFor(x => x.Priority)
                .InclusiveBetween(1, 10).WithMessage("Priority must be between 1 and 10.");

            RuleFor(x => x.Category)
                .NotEmpty().WithMessage("Category is required.")
                .Must(cat => AllowedCategories.Contains(cat.ToLower()))
                .WithMessage($"Category must be one of the following: {string.Join(", ", AllowedCategories)}");
        }
    }
}
