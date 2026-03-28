import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findExistingTagIds(tagIds: string[]): Promise<string[]> {
    if (!tagIds || tagIds.length === 0) return [];

    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true },
    });

    return tags.map(tag => tag.id);
  }

  async allTagIdsExist(tagIds: string[]): Promise<boolean> {
    if (!tagIds || tagIds.length === 0) return true; // mảng rỗng → coi như hợp lệ

    const count = await this.prisma.tag.count({
      where: { id: { in: tagIds } },
    });

    return count === tagIds.length;
  }
}