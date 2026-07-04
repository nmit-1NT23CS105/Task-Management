import unittest

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.routes.auth import login, signup
from app.schemas.user import UserCreate, UserLogin


class AuthRouteTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=engine)
        session_factory = sessionmaker(bind=engine)
        self.db = session_factory()

    def tearDown(self):
        self.db.close()

    def test_signup_trims_username_and_login_matches_email_case_insensitively(self):
        created = signup(
            UserCreate(
                username="  DebugUser  ",
                email="DebugUser@Example.COM",
                password="secret123",
            ),
            self.db,
        )

        self.assertEqual(created["user"].username, "DebugUser")
        self.assertEqual(created["user"].email, "debuguser@example.com")

        logged_in = login(
            UserLogin(email="debuguser@example.com", password="secret123"),
            self.db,
        )

        self.assertEqual(logged_in["user"].id, created["user"].id)
        self.assertTrue(logged_in["access_token"])

    def test_signup_rejects_duplicate_email_ignoring_case(self):
        signup(
            UserCreate(
                username="first_user",
                email="same@example.com",
                password="secret123",
            ),
            self.db,
        )

        with self.assertRaises(HTTPException) as error:
            signup(
                UserCreate(
                    username="second_user",
                    email="Same@Example.com",
                    password="secret123",
                ),
                self.db,
            )

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.detail, "Email is already registered")


if __name__ == "__main__":
    unittest.main()
