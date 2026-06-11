export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          price: number;
          compare_price: number | null;
          status: "draft" | "published" | "archived";
          featured: boolean;
          material: string | null;
          weight_grams: number | null;
          sku: string | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          position: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["product_images"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["product_images"]["Insert"]
        >;
      };
      product_videos: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          thumbnail_url: string | null;
          title: string | null;
          position: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["product_videos"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["product_videos"]["Insert"]
        >;
      };
      collections: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          position: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["collections"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["collections"]["Insert"]
        >;
      };
      product_collections: {
        Row: { product_id: string; collection_id: string };
        Insert: Database["public"]["Tables"]["product_collections"]["Row"];
        Update: Partial<
          Database["public"]["Tables"]["product_collections"]["Row"]
        >;
      };
      attributes: {
        Row: {
          id: string;
          name: string;
          type: "color" | "text" | "size";
          position: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["attributes"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["attributes"]["Insert"]
        >;
      };
      attribute_values: {
        Row: {
          id: string;
          attribute_id: string;
          value: string;
          label: string;
          color_code: string | null;
          position: number;
        };
        Insert: Omit<
          Database["public"]["Tables"]["attribute_values"]["Row"],
          "id"
        > & { id?: string };
        Update: Partial<
          Database["public"]["Tables"]["attribute_values"]["Insert"]
        >;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string | null;
          price: number | null;
          compare_price: number | null;
          inventory_quantity: number;
          position: number;
          title: string;
          available: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["product_variants"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["product_variants"]["Insert"]
        >;
      };
      variant_attributes: {
        Row: { variant_id: string; attribute_value_id: string };
        Insert: Database["public"]["Tables"]["variant_attributes"]["Row"];
        Update: Partial<
          Database["public"]["Tables"]["variant_attributes"]["Row"]
        >;
      };
      homepage_sections: {
        Row: {
          id: string;
          section: string;
          key: string;
          value: Json;
          type: string;
          position: number;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["homepage_sections"]["Row"],
          "id" | "updated_at"
        > & { id?: string; updated_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["homepage_sections"]["Insert"]
        >;
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          type: string;
          group: string;
          label: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["site_settings"]["Row"],
          "id" | "updated_at"
        > & { id?: string; updated_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["site_settings"]["Insert"]
        >;
      };
    };
  };
};

// Convenience types
export type Product =
  Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert =
  Database["public"]["Tables"]["products"]["Insert"];
export type ProductImage =
  Database["public"]["Tables"]["product_images"]["Row"];
export type ProductVideo =
  Database["public"]["Tables"]["product_videos"]["Row"];
export type Collection =
  Database["public"]["Tables"]["collections"]["Row"];
export type Attribute =
  Database["public"]["Tables"]["attributes"]["Row"];
export type AttributeValue =
  Database["public"]["Tables"]["attribute_values"]["Row"];
export type ProductVariant =
  Database["public"]["Tables"]["product_variants"]["Row"];
export type HomepageSection =
  Database["public"]["Tables"]["homepage_sections"]["Row"];
export type SiteSetting =
  Database["public"]["Tables"]["site_settings"]["Row"];

export type ProductWithImages = Product & {
  product_images: ProductImage[];
  product_variants: ProductVariant[];
  product_collections: Array<{ collections: Collection }>;
};
