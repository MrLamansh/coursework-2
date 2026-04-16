from app.models.user import User
from app.models.client import Client
from app.models.directories import (
	ContractStatus,
	DomainStatus,
	EventType,
	PaymentStatus,
	PaymentType,
	Registrar,
	RequestStatus,
	RequestType,
)
from app.models.contract import Contract
from app.models.domain import Domain
from app.models.request import Request
from app.models.event import DomainEvent
from app.models.payment import Payment

from sqlalchemy.orm import configure_mappers
configure_mappers()