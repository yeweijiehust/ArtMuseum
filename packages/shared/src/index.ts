import { Type, type Static } from "@sinclair/typebox";

export const locales = ["en", "zh"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文"
};

export const ErrorCodes = {
  ValidationError: "VALIDATION_ERROR",
  BadRequest: "BAD_REQUEST",
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
  EmailExists: "EMAIL_EXISTS",
  InvalidCredentials: "INVALID_CREDENTIALS",
  FileRequired: "FILE_REQUIRED",
  TitleRequired: "TITLE_REQUIRED",
  InvalidFileType: "INVALID_FILE_TYPE",
  FileTooLarge: "FILE_TOO_LARGE",
  StorageFailure: "STORAGE_FAILURE"
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorResponseSchema = Type.Object(
  {
    error: Type.Object(
      {
        code: Type.String(),
        message: Type.String()
      },
      { additionalProperties: false }
    )
  },
  { additionalProperties: false }
);

export const UserPublicSchema = Type.Object(
  {
    id: Type.String(),
    email: Type.String(),
    displayName: Type.String(),
    createdAt: Type.String()
  },
  { additionalProperties: false }
);

export const AuthUserResponseSchema = Type.Object(
  {
    user: UserPublicSchema
  },
  { additionalProperties: false }
);

export const RegisterBodySchema = Type.Object(
  {
    displayName: Type.String({ minLength: 2, maxLength: 80 }),
    email: Type.String({ minLength: 3, maxLength: 254 }),
    password: Type.String({ minLength: 8, maxLength: 128 })
  },
  { additionalProperties: false }
);

export const LoginBodySchema = Type.Object(
  {
    email: Type.String({ minLength: 3, maxLength: 254 }),
    password: Type.String({ minLength: 8, maxLength: 128 })
  },
  { additionalProperties: false }
);

export const ImageSchema = Type.Object(
  {
    id: Type.String(),
    ownerId: Type.String(),
    ownerDisplayName: Type.String(),
    url: Type.String(),
    width: Type.Number(),
    height: Type.Number(),
    format: Type.String(),
    bytes: Type.Number(),
    title: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    altText: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String(),
    updatedAt: Type.String()
  },
  { additionalProperties: false }
);

export const ImageListResponseSchema = Type.Object(
  {
    items: Type.Array(ImageSchema),
    nextCursor: Type.Union([Type.String(), Type.Null()])
  },
  { additionalProperties: false }
);

export const ImageParamsSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 })
  },
  { additionalProperties: false }
);

export const ImageListQuerySchema = Type.Object(
  {
    cursor: Type.Optional(Type.String({ minLength: 1 })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 }))
  },
  { additionalProperties: false }
);

export const ImageUpdateBodySchema = Type.Object(
  {
    title: Type.Optional(Type.String({ minLength: 1, maxLength: 120 })),
    description: Type.Optional(Type.String({ maxLength: 1000 })),
    altText: Type.Optional(Type.String({ maxLength: 300 }))
  },
  { additionalProperties: false }
);

export const HealthResponseSchema = Type.Object(
  {
    ok: Type.Boolean(),
    service: Type.String()
  },
  { additionalProperties: false }
);

export type ApiError = Static<typeof ErrorResponseSchema>;
export type PublicUser = Static<typeof UserPublicSchema>;
export type AuthUserResponse = Static<typeof AuthUserResponseSchema>;
export type RegisterBody = Static<typeof RegisterBodySchema>;
export type LoginBody = Static<typeof LoginBodySchema>;
export type GalleryImage = Static<typeof ImageSchema>;
export type ImageListResponse = Static<typeof ImageListResponseSchema>;
export type ImageListQuery = Static<typeof ImageListQuerySchema>;
export type ImageParams = Static<typeof ImageParamsSchema>;
export type ImageUpdateBody = Static<typeof ImageUpdateBodySchema>;
export type HealthResponse = Static<typeof HealthResponseSchema>;
