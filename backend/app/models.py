"""The press kit the frontend renders (mirrors src/types.ts). JSON uses camelCase."""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Photo(CamelModel):
    src: str
    alt: str


class Platform(CamelModel):
    name: str
    url: str


class StatItem(CamelModel):
    value: str
    label: str


class BioContent(CamelModel):
    short: str
    extra: str | None = None


class ChartEntry(CamelModel):
    title: str
    label: str
    position: str
    url: str | None = None  # Spotify track


class BookingInfo(CamelModel):
    contact: str | None = None
    email: str
    agency_url: str
    agency_label: str


class RosterArtist(CamelModel):
    id: str  # the press kit slug, i.e. the artist-id of <artist-epk>
    name: str
    country: str | None = None  # ISO 3166 code, e.g. "CA"; the tile shows its flag
    photo: Photo


class Roster(CamelModel):
    artists: list[RosterArtist]


class Epk(CamelModel):
    name: str
    country: str | None = None  # ISO 3166 code, e.g. "CA"; shown as a flag next to the name
    label: str
    kicker: str
    photo: Photo
    tags: list[str]
    platforms: list[Platform]
    lede: str
    stats: list[StatItem]
    bio: BioContent
    charts: list[ChartEntry]
    booking: BookingInfo
    accent_color: str | None = None  # "#rrggbb"; the EPK falls back to its orange when absent
