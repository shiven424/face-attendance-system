from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import List, Optional

@dataclass
class User:
    name: str
    email: str
    password: str
    role: str
    subjects: List[str] = field(default_factory=list)
    registeredAt: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Subject:
    name: str
    teacherId: str
    teacherMail:str
    students: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class AttendanceSession:
    subjectId: str
    teacherId: str
    teacherMail: str
    date: str = field(default_factory=lambda: datetime.now().strftime('%Y-%m-%d'))
    active: bool = True
    createdAt: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            'subjectId': self.subjectId,
            'teacherId': self.teacherId,
            'teacherMail': self.teacherMail,
            'date': self.date,
            'active': self.active,
            'createdAt': self.createdAt.isoformat()  # Convert datetime to ISO format string
        }


@dataclass
class AttendanceRecord:
    sessionId: str
    studentId: str
    markedAt: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            'sessionId': self.sessionId,
            'studentId': self.studentId,
            'markedAt': self.markedAt.isoformat()  # Convert datetime to ISO format string
        }
