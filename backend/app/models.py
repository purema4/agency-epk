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


class BookingInfo(CamelModel):
    contact: str | None = None
    email: str
    agency_url: str
    agency_label: str


class Epk(CamelModel):
    name: str
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
