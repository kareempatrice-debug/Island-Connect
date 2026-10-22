import type { Metadata } from "next";
import { NeedsDatabase } from "@/components/demo-notice";
import { RegisterBusinessForm } from "@/components/forms/register-business-form";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { data, getCountry, isSupabaseConfigured } from "@/lib/data";

// Personal or search-driven: always built fresh for each visitor, never shared.
export const dynamic = "force-dynamic";


export const metadata: Metadata = { title: "Register your business", robots: { index: false } };

export default async function Register({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const country = (await getCountry(code))!;
  if (!isSupabaseConfigured) {
    return (
      <Container className="max-w-2xl py-12">
        <h1 className="text-4xl font-semibold">Register your business</h1>
        <div className="mt-8"><NeedsDatabase feature="Business registration" /></div>
      </Container>
    );
  }
  await requireViewer(`/${code}/for-business/register`, code);
  const [categories, islands, districts] = await Promise.all([data.getCategories(code), data.getIslands(code), data.getDistricts(code)]);
  const groups = categories
    .filter((c) => !c.parentSlug)
    .map((p) => ({ slug: p.slug, name: p.name, children: categories.filter((c) => c.parentSlug === p.slug).map(({ slug, name }) => ({ slug, name })) }));

  return (
    <Container className="max-w-2xl py-10 sm:py-14">
      <p className="text-sm font-semibold text-link">Free listing · {country.name}</p>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Register your business</h1>
      <p className="mt-3 text-lg">Four short steps. If your business already appears on Island Connect, claim that listing instead from its page.</p>
      <div className="mt-8">
        <RegisterBusinessForm
          country={{ code, name: country.name, districtLabel: country.districtLabel }}
          groups={groups}
          islands={islands.map(({ slug, name }) => ({ slug, name }))}
          districts={districts.map(({ slug, name, islandSlug }) => ({ slug, name, islandSlug }))}
        />
      </div>
    </Container>
  );
}
