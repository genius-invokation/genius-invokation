CREATE TABLE "User" (
	"id" integer PRIMARY KEY NOT NULL,
	"ghToken" text,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Game" (
	"id" serial PRIMARY KEY NOT NULL,
	"coreVersion" text NOT NULL,
	"gameVersion" text NOT NULL,
	"data" jsonb NOT NULL,
	"winnerId" integer,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PlayerOnGames" (
	"playerId" integer NOT NULL,
	"gameId" integer NOT NULL,
	"who" integer NOT NULL,
	CONSTRAINT "PlayerOnGames_playerId_gameId_pk" PRIMARY KEY("playerId","gameId")
);
--> statement-breakpoint
CREATE TABLE "Deck" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"requiredVersion" integer NOT NULL,
	"ownerUserId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "PlayerOnGames" ADD CONSTRAINT "PlayerOnGames_playerId_User_id_fk" FOREIGN KEY ("playerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PlayerOnGames" ADD CONSTRAINT "PlayerOnGames_gameId_Game_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_ownerUserId_User_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;