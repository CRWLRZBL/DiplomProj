-- Переписки на сайте (клиент ↔ салон, сотрудник ↔ сотрудник).
-- Идемпотентно: можно выполнять повторно при развёртывании.

IF OBJECT_ID(N'dbo.ChatConversations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChatConversations (
        ChatConversationId INT IDENTITY(1,1) NOT NULL,
        ConversationType   TINYINT NOT NULL,
        ClientUserId       INT NULL,
        StaffKeyUser1      INT NULL,
        StaffKeyUser2      INT NULL,
        CreatedAt          DATETIME2 NOT NULL CONSTRAINT DF_ChatConversations_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt          DATETIME2 NOT NULL CONSTRAINT DF_ChatConversations_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_ChatConversations PRIMARY KEY (ChatConversationId),
        CONSTRAINT FK_ChatConversations_ClientUser FOREIGN KEY (ClientUserId) REFERENCES dbo.Users (UserID),
        CONSTRAINT FK_ChatConversations_StaffKeyUser1 FOREIGN KEY (StaffKeyUser1) REFERENCES dbo.Users (UserID),
        CONSTRAINT FK_ChatConversations_StaffKeyUser2 FOREIGN KEY (StaffKeyUser2) REFERENCES dbo.Users (UserID)
    );
END
GO

IF OBJECT_ID(N'dbo.ChatConversations', N'U') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_ChatConversations_ClientUserId'
          AND object_id = OBJECT_ID(N'dbo.ChatConversations')
    )
BEGIN
    CREATE UNIQUE INDEX IX_ChatConversations_ClientUserId
        ON dbo.ChatConversations (ClientUserId)
        WHERE ClientUserId IS NOT NULL;
END
GO

IF OBJECT_ID(N'dbo.ChatConversations', N'U') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_ChatConversations_StaffPair'
          AND object_id = OBJECT_ID(N'dbo.ChatConversations')
    )
BEGIN
    CREATE UNIQUE INDEX IX_ChatConversations_StaffPair
        ON dbo.ChatConversations (StaffKeyUser1, StaffKeyUser2)
        WHERE ConversationType = 1 AND StaffKeyUser1 IS NOT NULL AND StaffKeyUser2 IS NOT NULL;
END
GO

IF OBJECT_ID(N'dbo.ChatMessages', N'U') IS NULL
    AND OBJECT_ID(N'dbo.ChatConversations', N'U') IS NOT NULL
BEGIN
    CREATE TABLE dbo.ChatMessages (
        ChatMessageId       INT IDENTITY(1,1) NOT NULL,
        ChatConversationId  INT NOT NULL,
        SenderUserId        INT NOT NULL,
        Body                NVARCHAR(2000) NOT NULL,
        CreatedAt           DATETIME2 NOT NULL CONSTRAINT DF_ChatMessages_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_ChatMessages PRIMARY KEY (ChatMessageId),
        CONSTRAINT FK_ChatMessages_Conversation FOREIGN KEY (ChatConversationId)
            REFERENCES dbo.ChatConversations (ChatConversationId) ON DELETE CASCADE,
        CONSTRAINT FK_ChatMessages_Sender FOREIGN KEY (SenderUserId) REFERENCES dbo.Users (UserID)
    );
END
GO
