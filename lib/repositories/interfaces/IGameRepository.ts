import type {
  Game,
  GameStatus,
  BoardState,
  CardInstance,
  CardMoveDTO,
  CreateGameDTO,
  ZoneType,
} from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";

export interface IGameRepository {
  // Game CRUD
  findById(id: string): Promise<Game | null>;
  findActive(): Promise<Game[]>;
  create(dto: CreateGameDTO): Promise<Game>;
  updateStatus(id: string, status: GameStatus): Promise<void>;
  delete(id: string): Promise<boolean>;

  // Board state operations
  getBoardState(gameId: string, playerSide: PlayerSide): Promise<BoardState>;
  getFullBoardState(gameId: string): Promise<{ red: BoardState; blue: BoardState }>;
  getZone(gameId: string, playerSide: PlayerSide, zone: ZoneType): Promise<CardInstance[]>;

  // Card operations
  addCardToZone(
    gameId: string,
    playerSide: PlayerSide,
    zone: ZoneType,
    cardId: string,
    options?: { isFaceUp?: boolean; position?: number; isExhausted?: boolean }
  ): Promise<CardInstance>;

  moveCard(gameId: string, playerSide: PlayerSide, move: CardMoveDTO): Promise<void>;
  flipCard(gameId: string, cardInstanceId: string): Promise<void>;
  exhaustCard(gameId: string, cardInstanceId: string): Promise<void>;
  updateTempMight(gameId: string, cardInstanceId: string, tempMight: number | null): Promise<void>;
  removeCard(gameId: string, cardInstanceId: string): Promise<void>;

  // Game setup
  initializeBoardFromDeck(gameId: string, playerSide: PlayerSide, deckId: string): Promise<void>;
  resetGame(gameId: string): Promise<void>;

  // Utility
  drawCard(gameId: string, playerSide: PlayerSide, fromDeck: "main_deck" | "rune_deck"): Promise<CardInstance | null>;
  peekCard(gameId: string, playerSide: PlayerSide, fromDeck: "main_deck" | "rune_deck"): Promise<CardInstance | null>;
  recycleRune(gameId: string, playerSide: PlayerSide, cardInstanceId: string): Promise<void>;
  recycleHand(gameId: string, playerSide: PlayerSide, cardInstanceId: string): Promise<void>;
  recycleTrash(gameId: string, playerSide: PlayerSide): Promise<void>;
  recycleBattlefield(gameId: string, playerSide: PlayerSide, cardInstanceId: string): Promise<void>;
  shuffleZone(gameId: string, playerSide: PlayerSide, zone: ZoneType): Promise<void>;

  // Battleground management
  setActiveBattleground(gameId: string, playerSide: PlayerSide, cardInstanceId: string | null): Promise<void>;
  getActiveBattlegrounds(gameId: string): Promise<{ red: string | null; blue: string | null }>;

  // Score management
  setScore(gameId: string, playerSide: PlayerSide, score: number): Promise<void>;
  getScores(gameId: string): Promise<{ red: number; blue: number }>;
}
