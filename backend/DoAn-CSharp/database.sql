IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'VinhKhanhExplorer')
BEGIN
    CREATE DATABASE [VinhKhanhExplorer];
END;
GO

USE [VinhKhanhExplorer];
GO

IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [AdminUsers] (
    [Id] int NOT NULL IDENTITY,
    [Username] nvarchar(450) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [Role] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AdminUsers] PRIMARY KEY ([Id])
);

CREATE TABLE [Languages] (
    [Code] nvarchar(450) NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [NativeName] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [SortOrder] int NOT NULL,
    CONSTRAINT [PK_Languages] PRIMARY KEY ([Code])
);

CREATE TABLE [POICategories] (
    [Id] int NOT NULL IDENTITY,
    [Slug] nvarchar(450) NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [IconUrl] nvarchar(max) NULL,
    [Color] nvarchar(max) NULL,
    [SortOrder] int NOT NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_POICategories] PRIMARY KEY ([Id])
);

CREATE TABLE [Tours] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [EstimatedMinutes] int NOT NULL,
    [DistanceKm] float NOT NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_Tours] PRIMARY KEY ([Id])
);

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [Username] nvarchar(450) NOT NULL,
    [Email] nvarchar(450) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [DisplayName] nvarchar(max) NOT NULL,
    [AvatarUrl] nvarchar(max) NULL,
    [DefaultLanguage] nvarchar(max) NOT NULL,
    [RefreshToken] nvarchar(max) NULL,
    [RefreshTokenExpiry] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [POIs] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Slug] nvarchar(450) NOT NULL,
    [Latitude] float NOT NULL,
    [Longitude] float NOT NULL,
    [TriggerRadiusMeters] int NOT NULL,
    [Category] nvarchar(450) NOT NULL,
    [CategoryId] int NULL,
    [Priority] int NOT NULL,
    [Address] nvarchar(max) NULL,
    [Ward] nvarchar(max) NULL,
    [District] nvarchar(max) NULL,
    [City] nvarchar(max) NULL,
    [Phone] nvarchar(max) NULL,
    [Website] nvarchar(max) NULL,
    [FacebookUrl] nvarchar(max) NULL,
    [ImageUrl] nvarchar(max) NULL,
    [GoogleMapsUrl] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_POIs] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_POIs_POICategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [POICategories] ([Id]) ON DELETE SET NULL
);

CREATE TABLE [AudioFiles] (
    [Id] int NOT NULL IDENTITY,
    [POIId] int NOT NULL,
    [LanguageCode] nvarchar(max) NOT NULL,
    [FilePath] nvarchar(max) NOT NULL,
    [DurationSeconds] int NOT NULL,
    [AudioType] nvarchar(max) NOT NULL,
    [TTSProvider] nvarchar(max) NULL,
    [VoiceName] nvarchar(max) NULL,
    [GeneratedAt] datetime2 NULL,
    [IsDefault] bit NOT NULL,
    CONSTRAINT [PK_AudioFiles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AudioFiles_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Favorites] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [POIId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Favorites] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Favorites_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Favorites_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [MenuItems] (
    [Id] int NOT NULL IDENTITY,
    [POIId] int NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [Currency] nvarchar(max) NOT NULL,
    [ImageUrl] nvarchar(max) NULL,
    [SortOrder] int NOT NULL,
    CONSTRAINT [PK_MenuItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MenuItems_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [POITranslations] (
    [Id] int NOT NULL IDENTITY,
    [POIId] int NOT NULL,
    [LanguageCode] nvarchar(450) NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [ShortDescription] nvarchar(max) NOT NULL,
    [FullDescription] nvarchar(max) NOT NULL,
    [AudioText] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_POITranslations] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_POITranslations_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [QRCodes] (
    [Id] int NOT NULL IDENTITY,
    [POIId] int NOT NULL,
    [Code] nvarchar(450) NOT NULL,
    [QRImageUrl] nvarchar(max) NULL,
    [ScanCount] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_QRCodes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_QRCodes_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [QuizQuestions] (
    [Id] int NOT NULL IDENTITY,
    [POIId] int NOT NULL,
    [QuestionText] nvarchar(max) NOT NULL,
    [AnswerA] nvarchar(max) NOT NULL,
    [AnswerB] nvarchar(max) NOT NULL,
    [AnswerC] nvarchar(max) NOT NULL,
    [AnswerD] nvarchar(max) NOT NULL,
    [CorrectOption] nvarchar(1) NOT NULL,
    [ExplanationText] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_QuizQuestions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_QuizQuestions_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [TourStops] (
    [Id] int NOT NULL IDENTITY,
    [TourId] int NOT NULL,
    [POIId] int NOT NULL,
    [StopOrder] int NOT NULL,
    [TransitionNote] nvarchar(max) NULL,
    CONSTRAINT [PK_TourStops] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TourStops_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TourStops_Tours_TourId] FOREIGN KEY ([TourId]) REFERENCES [Tours] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [VisitLogs] (
    [Id] int NOT NULL IDENTITY,
    [POIId] int NOT NULL,
    [UserId] int NULL,
    [SessionId] nvarchar(max) NULL,
    [TriggerType] nvarchar(max) NOT NULL,
    [LanguageCode] nvarchar(max) NOT NULL,
    [VisitedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_VisitLogs] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_VisitLogs_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_VisitLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL
);

CREATE TABLE [AudioProgresses] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [AudioFileId] int NOT NULL,
    [CurrentSecond] float NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AudioProgresses] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AudioProgresses_AudioFiles_AudioFileId] FOREIGN KEY ([AudioFileId]) REFERENCES [AudioFiles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AudioProgresses_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [MenuItemTranslations] (
    [Id] int NOT NULL IDENTITY,
    [MenuItemId] int NOT NULL,
    [LanguageCode] nvarchar(450) NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_MenuItemTranslations] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MenuItemTranslations_MenuItems_MenuItemId] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [QuizQuestionTranslations] (
    [Id] int NOT NULL IDENTITY,
    [QuizQuestionId] int NOT NULL,
    [LanguageCode] nvarchar(max) NOT NULL,
    [QuestionText] nvarchar(max) NOT NULL,
    [AnswerA] nvarchar(max) NOT NULL,
    [AnswerB] nvarchar(max) NOT NULL,
    [AnswerC] nvarchar(max) NOT NULL,
    [AnswerD] nvarchar(max) NOT NULL,
    [ExplanationText] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_QuizQuestionTranslations] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_QuizQuestionTranslations_QuizQuestions_QuizQuestionId] FOREIGN KEY ([QuizQuestionId]) REFERENCES [QuizQuestions] ([Id]) ON DELETE CASCADE
);

CREATE UNIQUE INDEX [IX_AdminUsers_Username] ON [AdminUsers] ([Username]);

CREATE INDEX [IX_AudioFiles_POIId] ON [AudioFiles] ([POIId]);

CREATE INDEX [IX_AudioProgresses_AudioFileId] ON [AudioProgresses] ([AudioFileId]);

CREATE UNIQUE INDEX [IX_AudioProgresses_UserId_AudioFileId] ON [AudioProgresses] ([UserId], [AudioFileId]);

CREATE INDEX [IX_Favorites_POIId] ON [Favorites] ([POIId]);

CREATE UNIQUE INDEX [IX_Favorites_UserId_POIId] ON [Favorites] ([UserId], [POIId]);

CREATE INDEX [IX_MenuItems_POIId] ON [MenuItems] ([POIId]);

CREATE UNIQUE INDEX [IX_MenuItemTranslations_MenuItemId_LanguageCode] ON [MenuItemTranslations] ([MenuItemId], [LanguageCode]);

CREATE UNIQUE INDEX [IX_POICategories_Slug] ON [POICategories] ([Slug]);

CREATE INDEX [IX_POIs_Category] ON [POIs] ([Category]);

CREATE INDEX [IX_POIs_CategoryId] ON [POIs] ([CategoryId]);

CREATE INDEX [IX_POIs_DeletedAt] ON [POIs] ([DeletedAt]);

CREATE INDEX [IX_POIs_IsActive] ON [POIs] ([IsActive]);

CREATE UNIQUE INDEX [IX_POIs_Slug] ON [POIs] ([Slug]);

CREATE UNIQUE INDEX [IX_POITranslations_POIId_LanguageCode] ON [POITranslations] ([POIId], [LanguageCode]);

CREATE UNIQUE INDEX [IX_QRCodes_Code] ON [QRCodes] ([Code]);

CREATE INDEX [IX_QRCodes_POIId] ON [QRCodes] ([POIId]);

CREATE INDEX [IX_QuizQuestions_POIId] ON [QuizQuestions] ([POIId]);

CREATE INDEX [IX_QuizQuestionTranslations_QuizQuestionId] ON [QuizQuestionTranslations] ([QuizQuestionId]);

CREATE INDEX [IX_TourStops_POIId] ON [TourStops] ([POIId]);

CREATE INDEX [IX_TourStops_TourId] ON [TourStops] ([TourId]);

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);

CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);

CREATE INDEX [IX_VisitLogs_POIId] ON [VisitLogs] ([POIId]);

CREATE INDEX [IX_VisitLogs_UserId] ON [VisitLogs] ([UserId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260606031955_InitialCreate', N'9.0.0');

COMMIT;
GO

