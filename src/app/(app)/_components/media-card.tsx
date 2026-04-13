/**
 * MediaCard — reusable album-art-style card for tracks, albums, artists, playlists.
 *
 * Usage:
 *   <MediaCard title="Album name" subtitle="Artist" type="album" />
 *   <MediaCard title="Track" subtitle="Artist" type="track" action={<button>...</button>} />
 */

type MediaCardType = "track" | "album" | "artist" | "playlist" | "generic";

type MediaCardProps = {
  title: string;
  subtitle?: string | null;
  type?: MediaCardType;
  imageUrl?: string | null;
  /** Optional action slot rendered in the bottom-right corner on hover */
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

const ACCENT_GRADIENTS: Record<MediaCardType, string> = {
  track: "linear-gradient(135deg, #fc3c44 0%, #ff8a80 100%)",
  album: "linear-gradient(135deg, #5856d6 0%, #af52de 100%)",
  artist: "linear-gradient(135deg, #007aff 0%, #34aadc 100%)",
  playlist: "linear-gradient(135deg, #34c759 0%, #30d158 100%)",
  generic: "linear-gradient(135deg, #636366 0%, #8e8e93 100%)",
};

function ArtworkPlaceholder({ type }: { type: MediaCardType }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background: ACCENT_GRADIENTS[type],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ArtworkIcon type={type} />
    </div>
  );
}

function ArtworkIcon({ type }: { type: MediaCardType }) {
  const style: React.CSSProperties = { width: "36%", height: "36%", color: "rgba(255,255,255,0.7)" };
  if (type === "track" || type === "album") {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" style={style}>
        <path d="M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm8-2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM6 10a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
      </svg>
    );
  }
  if (type === "artist") {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" style={style}>
        <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
      </svg>
    );
  }
  if (type === "playlist") {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" style={style}>
        <path d="M3.75 3a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H3.75ZM3 7.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 7.25Zm0 4a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 3 11.25Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={style}>
      <path d="M17.293 4.22a.75.75 0 0 0-1.054-.104L13.5 6.28V5.25a.75.75 0 0 0-1.5 0V7.5L9 9.69V5.25a.75.75 0 0 0-1.5 0V12l-1.25.96a.75.75 0 0 0 .926 1.18l9-6.92a.75.75 0 0 0 .117-1.0Z" />
    </svg>
  );
}

/** Square media card — for grid layouts */
export function MediaCard({
  title,
  subtitle,
  type = "generic",
  imageUrl,
  action,
  onClick,
  className = "",
}: MediaCardProps) {
  const isInteractive = !!onClick;

  return (
    <article
      className={`group flex flex-col gap-2 ${isInteractive ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {/* Square artwork */}
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{
          aspectRatio: type === "artist" ? "1 / 1" : "1 / 1",
          boxShadow: "var(--shadow-md)",
          borderRadius: type === "artist" ? "9999px" : "12px",
          transform: "translateZ(0)",
          transition: "transform 200ms ease, box-shadow 200ms ease",
        }}
        onMouseEnter={(e) => {
          if (isInteractive) {
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1.03) translateZ(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)";
          }
        }}
        onMouseLeave={(e) => {
          if (isInteractive) {
            (e.currentTarget as HTMLDivElement).style.transform = "translateZ(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
          }
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <ArtworkPlaceholder type={type} />
        )}

        {/* Action overlay */}
        {action ? (
          <div
            className="absolute inset-0 flex items-end justify-end p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }}
          >
            {action}
          </div>
        ) : null}
      </div>

      {/* Labels */}
      <div className="flex flex-col gap-0.5">
        <p
          className="truncate text-sm font-semibold leading-snug"
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </p>
        {subtitle ? (
          <p
            className="truncate text-xs leading-snug"
            style={{ color: "var(--fg-secondary)" }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </article>
  );
}

/** Horizontal media row — for list layouts */
export function MediaRow({
  title,
  subtitle,
  type = "generic",
  imageUrl,
  action,
  onClick,
  className = "",
}: MediaCardProps) {
  const isInteractive = !!onClick;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2 am-transition ${
        isInteractive ? "cursor-pointer" : ""
      } ${className}`}
      style={{ background: "transparent" }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isInteractive) {
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-overlay)";
        }
      }}
      onMouseLeave={(e) => {
        if (isInteractive) {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: 40,
          height: 40,
          borderRadius: type === "artist" ? "9999px" : "8px",
          boxShadow: "var(--shadow-xs)",
          background: ACCENT_GRADIENTS[type],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden="true"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <ArtworkIcon type={type} />
        )}
      </div>

      {/* Labels */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium leading-snug"
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </p>
        {subtitle ? (
          <p
            className="truncate text-xs leading-snug"
            style={{ color: "var(--fg-secondary)" }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Action */}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
