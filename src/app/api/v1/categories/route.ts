import { NextRequest } from "next/server";
import { CategoryService } from "@/services/category.service";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  try {
    const categories = await CategoryService.getAllCategories();
    return ApiResponse.success(categories, "Categories retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
