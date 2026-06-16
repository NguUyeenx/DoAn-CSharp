# Design Spec: TTS Voice Audio Manager Enhancements

## Goal
Enhance the Admin TTS Voice Audio Manager by:
1. Replacing the "Regenerate All TTS" button with checkboxes for active languages and a "Regenerate Selected TTS" button.
2. Adding client-side pagination, sorting, and filtering (by Food Spot Name and Language) to improve list usability.

## Proposed Changes

### Backend
1. **DTO:** Add `RegenerateAudioRequest` in `AdminController.cs` (or bottom of file) to represent selected languages.
2. **Endpoint:** Update `RegenerateAllAudio` in `AdminController.cs` to accept the DTO. If specific languages are provided, filter query to only regenerate matching files. Else, regenerate all.

### Frontend API Client
1. **API Client (`admin.ts`):** Modify `regenerateAllAudio` to accept a `languages` parameter (array of strings) and send it in the request body.

### Frontend UI
1. **States (`AudioListPage.tsx`):**
   - Add states for `languages`, `selectedRegenLangs`, `searchTerm`, `filterLanguage`, `sortBy`, `sortOrder`, and `currentPage`.
2. **Data Fetching:**
   - Call `adminApi.getLanguages()` in `loadData` alongside audio files and POIs.
   - Filter active languages and initialize `selectedRegenLangs` with all active language codes.
3. **Filtering, Sorting, and Pagination (`useMemo`):**
   - Filter by name search and selected language.
   - Sort by Food Spot Name or Language Code.
   - Slice the resulting array based on current page and items per page (10).
4. **UI Elements:**
   - **Regen Toolbar:** Checkboxes for active languages, followed by a button "Regenerate Selected TTS".
   - **Filters:** Text input for searching food spots, dropdown select for filtering languages.
   - **Sorting:** Interactive table headers with sort indicators (up/down arrows) for Name and Language.
   - **Pagination Footer:** Navigation buttons (`Prev`, page numbers, `Next`) and page summary text.
