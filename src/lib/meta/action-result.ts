export type ActionResult = {
  ok: boolean;
  message: string;
  details?: {
    displayPhoneNumber?: string;
    verifiedName?: string;
    qualityRating?: string;
    wabaName?: string;
  };
};
