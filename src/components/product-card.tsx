import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice, type Product } from "@/lib/store";

const typeBadgeColors: Record<string, string> = {
  pdf: "bg-blue-500/10 text-blue-600",
  map: "bg-green-500/10 text-green-600",
  bundle: "bg-purple-500/10 text-purple-600",
  other: "bg-gray-500/10 text-gray-600",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/store/${product.slug}`} className="group">
      <Card className="h-full border-0 bg-muted/30 transition-colors group-hover:bg-muted/50">
        {product.imageUrl && (
          <div className="overflow-hidden rounded-t-lg">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={640}
              height={480}
              className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeColors[product.productType] ?? typeBadgeColors.other}`}
            >
              {product.productType.toUpperCase()}
            </span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.priceInCents)}
            </span>
          </div>
          <CardTitle className="line-clamp-2 text-lg">{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3">
            {product.description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
