using FluentValidation;
using DoAn_CSharp.Models.DTOs;
using System.Collections.Generic;
using DoAn_CSharp.Data;
using System.Linq;

namespace DoAn_CSharp.Validators
{
    public class POIUpdateValidator : AbstractValidator<POIUpdateDto>
    {
        public POIUpdateValidator(AppDbContext context)
        {
            RuleFor(x => x.Name)
                .MaximumLength(100).WithMessage("Name must not exceed 100 characters.")
                .When(x => x.Name != null);

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90.0, 90.0).WithMessage("Latitude must be between -90 and 90.")
                .When(x => x.Latitude.HasValue);

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180.0, 180.0).WithMessage("Longitude must be between -180 and 180.")
                .When(x => x.Longitude.HasValue);

            RuleFor(x => x.TriggerRadiusMeters)
                .InclusiveBetween(5, 500).WithMessage("Trigger radius must be between 5 and 500 meters.")
                .When(x => x.TriggerRadiusMeters.HasValue);

            RuleFor(x => x.Priority)
                .InclusiveBetween(1, 10).WithMessage("Priority must be between 1 and 10.")
                .When(x => x.Priority.HasValue);

            RuleFor(x => x.Category)
                .Must(cat => cat != null && context.POICategories.Any(c => c.Slug == cat.ToLower()))
                .WithMessage("Category must match one of the active categories in database.")
                .When(x => x.Category != null);
        }
    }
}
