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
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE TABLE [AdminUsers] (
        [Id] int NOT NULL IDENTITY,
        [Username] nvarchar(450) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [Role] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AdminUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE TABLE [Languages] (
        [Code] nvarchar(450) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [NativeName] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [SortOrder] int NOT NULL,
        CONSTRAINT [PK_Languages] PRIMARY KEY ([Code])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE TABLE [Tours] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [EstimatedMinutes] int NOT NULL,
        [DistanceKm] float NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_Tours] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE TABLE [Favorites] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [POIId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Favorites] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Favorites_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Favorites_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE TABLE [MenuItemTranslations] (
        [Id] int NOT NULL IDENTITY,
        [MenuItemId] int NOT NULL,
        [LanguageCode] nvarchar(450) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_MenuItemTranslations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MenuItemTranslations_MenuItems_MenuItemId] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AdminUsers_Username] ON [AdminUsers] ([Username]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AudioFiles_POIId] ON [AudioFiles] ([POIId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AudioProgresses_AudioFileId] ON [AudioProgresses] ([AudioFileId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AudioProgresses_UserId_AudioFileId] ON [AudioProgresses] ([UserId], [AudioFileId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Favorites_POIId] ON [Favorites] ([POIId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Favorites_UserId_POIId] ON [Favorites] ([UserId], [POIId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MenuItems_POIId] ON [MenuItems] ([POIId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MenuItemTranslations_MenuItemId_LanguageCode] ON [MenuItemTranslations] ([MenuItemId], [LanguageCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_POICategories_Slug] ON [POICategories] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_POIs_Category] ON [POIs] ([Category]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_POIs_CategoryId] ON [POIs] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_POIs_DeletedAt] ON [POIs] ([DeletedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_POIs_IsActive] ON [POIs] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_POIs_Slug] ON [POIs] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_POITranslations_POIId_LanguageCode] ON [POITranslations] ([POIId], [LanguageCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_QRCodes_Code] ON [QRCodes] ([Code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QRCodes_POIId] ON [QRCodes] ([POIId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuizQuestions_POIId] ON [QuizQuestions] ([POIId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_QuizQuestionTranslations_QuizQuestionId] ON [QuizQuestionTranslations] ([QuizQuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TourStops_POIId] ON [TourStops] ([POIId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_TourStops_TourId] ON [TourStops] ([TourId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_VisitLogs_POIId] ON [VisitLogs] ([POIId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_VisitLogs_UserId] ON [VisitLogs] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606031955_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260606031955_InitialCreate', N'9.0.0');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    ALTER TABLE [VisitLogs] DROP CONSTRAINT [FK_VisitLogs_Users_UserId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    DROP TABLE [AudioProgresses];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    DROP TABLE [Favorites];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    DROP TABLE [Users];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    DROP INDEX [IX_VisitLogs_UserId] ON [VisitLogs];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[VisitLogs]') AND [c].[name] = N'UserId');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [VisitLogs] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [VisitLogs] DROP COLUMN [UserId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    ALTER TABLE [POIs] ADD [ApprovalStatus] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    ALTER TABLE [POIs] ADD [OwnerId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    CREATE TABLE [AnalyticsEvents] (
        [Id] int NOT NULL IDENTITY,
        [AnonymousId] nvarchar(max) NOT NULL,
        [SessionId] nvarchar(max) NOT NULL,
        [EventType] nvarchar(max) NOT NULL,
        [EventData] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AnalyticsEvents] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    CREATE TABLE [Owners] (
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
        [OwnerStatus] nvarchar(max) NOT NULL,
        [AdminNote] nvarchar(max) NULL,
        CONSTRAINT [PK_Owners] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    CREATE INDEX [IX_POIs_OwnerId] ON [POIs] ([OwnerId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Owners_Email] ON [Owners] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Owners_Username] ON [Owners] ([Username]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    ALTER TABLE [POIs] ADD CONSTRAINT [FK_POIs_Owners_OwnerId] FOREIGN KEY ([OwnerId]) REFERENCES [Owners] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610073049_UpdateToOwnerAndAnalytics'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260610073049_UpdateToOwnerAndAnalytics', N'9.0.0');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    EXEC sp_rename N'[MenuItems].[SortOrder]', N'DisplayOrder', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    ALTER TABLE [Owners] ADD [LastLoginAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    ALTER TABLE [MenuItems] ADD [IsAvailable] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    ALTER TABLE [Languages] ADD [IsDefault] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    ALTER TABLE [AdminUsers] ADD [LastLoginAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NULL,
        [UserRole] nvarchar(max) NOT NULL,
        [Action] nvarchar(max) NOT NULL,
        [EntityName] nvarchar(max) NOT NULL,
        [EntityId] int NULL,
        [Details] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    CREATE TABLE [Notifications] (
        [Id] int NOT NULL IDENTITY,
        [OwnerId] int NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [IsRead] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notifications_Owners_OwnerId] FOREIGN KEY ([OwnerId]) REFERENCES [Owners] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    CREATE TABLE [POIImages] (
        [Id] int NOT NULL IDENTITY,
        [POIId] int NOT NULL,
        [ImageUrl] nvarchar(max) NOT NULL,
        [IsCover] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_POIImages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_POIImages_POIs_POIId] FOREIGN KEY ([POIId]) REFERENCES [POIs] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    CREATE INDEX [IX_Notifications_OwnerId] ON [Notifications] ([OwnerId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    CREATE INDEX [IX_POIImages_POIId] ON [POIImages] ([POIId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260610095709_Phase1_10Features'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260610095709_Phase1_10Features', N'9.0.0');
END;

COMMIT;
GO


