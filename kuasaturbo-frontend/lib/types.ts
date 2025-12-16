// KuasaTurbo Frontend Types

export type CreativeTask =
  | "thumbnail"
  | "product_render"
  | "story_infographic"
  | "car_visualizer"
  | "image_cleanup";

export type CreativeStyle =
  | "energetic"
  | "premium"
  | "simple_clean"
  | "modern"
  | "vibrant";

export interface Vertical {
  slug: string;
  name: string;
  status: "available" | "coming_soon";
  description: string;
}

export interface GenerateCreativeParams {
  task: string;
  style: string;
  prompt?: string;
  image?: File;
  apiKey?: string;
}

export interface GenerateCreativeResponse {
  status: string;
  creative_id: string;
  task: string;
  style_used: string;
  model_used: string;
  credits_charged: number;
  mock_mode: boolean;
  outputs: {
    images: string[];
    copy: string;
    metadata: Record<string, any>;
  };
}

export type PlaygroundState = "idle" | "processing" | "complete" | "error";

export interface WorkerStep {
  name: string;
  emoji: string;
  status: "pending" | "active" | "complete";
}
