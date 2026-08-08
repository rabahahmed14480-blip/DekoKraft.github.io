import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import HomepageSurface from "../home-v2/HomepageSurface";

export type DkPublicCardProps = {
  title: ReactNode;
  description?: ReactNode;
  image?: ImageProps["src"];
  imageAlt?: string;
  href?: string;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  mediaFit?: "cover" | "contain";
  variant?: "default" | "feature" | "compact";
  className?: string;
};

export default function DkPublicCard({
  title,
  description,
  image,
  imageAlt = "",
  href,
  eyebrow,
  footer,
  mediaFit = "cover",
  variant = "default",
  className,
}: DkPublicCardProps) {
  const classes = [
    "dk-public-card",
    `dk-public-card--${variant}`,
    href && "dk-public-card--interactive",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const card = (
    <HomepageSurface
      as="article"
      className={classes}
      interactive={Boolean(href)}
    >
      {image && (
        <div className={`dk-public-card__media dk-public-card__media--${mediaFit}`}>
          <Image src={image} alt={imageAlt} fill sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 300px" />
        </div>
      )}
      <div className="dk-public-card__content">
        {eyebrow && <span className="dk-public-card__eyebrow">{eyebrow}</span>}
        <h3>{title}</h3>
        {description && <div className="dk-public-card__description">{description}</div>}
        {footer && <div className="dk-public-card__footer">{footer}</div>}
      </div>
    </HomepageSurface>
  );

  return href ? (
    <Link href={href} className="dk-public-card-link">
      {card}
    </Link>
  ) : (
    card
  );
}
