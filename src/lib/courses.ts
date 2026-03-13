import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type CourseOption = {
  code: string;
  name: string;
  isActive: boolean;
};

export function normalizeCourseCode(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 60);
}

export async function listCourses(includeInactive = false): Promise<CourseOption[]> {
  const whereClause = includeInactive
    ? Prisma.sql``
    : Prisma.sql`WHERE "isActive" = true`;

  const courses = await prisma.$queryRaw<CourseOption[]>`
    SELECT "code", "name", "isActive"
    FROM "AvailableCourse"
    ${whereClause}
    ORDER BY "isActive" DESC, "name" ASC
  `;

  return courses;
}

export async function getCourseNameMap(includeInactive = true) {
  const courses = await listCourses(includeInactive);
  return courses.reduce<Record<string, string>>((acc, course) => {
    acc[course.code] = course.name;
    return acc;
  }, {});
}

export async function areActiveCourseCodes(codes: string[]) {
  if (codes.length === 0) return true;

  const uniqueCodes = Array.from(new Set(codes));

  const activeCourses = await prisma.$queryRaw<Array<{ code: string }>>`
    SELECT "code"
    FROM "AvailableCourse"
    WHERE "isActive" = true
      AND "code" IN (${Prisma.join(uniqueCodes)})
  `;

  return activeCourses.length === uniqueCodes.length;
}

export async function isActiveCourseCode(code: string) {
  if (!code) return false;

  const [course] = await prisma.$queryRaw<Array<{ isActive: boolean }>>`
    SELECT "isActive"
    FROM "AvailableCourse"
    WHERE "code" = ${code}
    LIMIT 1
  `;

  return Boolean(course?.isActive);
}
