import { User, Listing, SwapOffer, MeetupTransaction, Conversation, VerificationRequest, Review } from '../types';

// All data is dynamically fetched from backend MySQL database via API service layer
export const SEED_USERS: User[] = [];
export const SEED_LISTINGS: Listing[] = [];
export const SEED_SWAPS: SwapOffer[] = [];
export const SEED_MEETUPS: MeetupTransaction[] = [];
export const SEED_CONVERSATIONS: Conversation[] = [];
export const SEED_VERIFICATIONS: VerificationRequest[] = [];
export const SEED_REVIEWS: Review[] = [];
export const SEED_VERIFICATION_REQUESTS: VerificationRequest[] = [];
