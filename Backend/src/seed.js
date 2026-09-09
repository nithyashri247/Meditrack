import "dotenv/config";
import bcrypt from "bcryptjs";

import { connectDatabase } from "./config/db.js";
import User from "./models/User.js";
import Doctor from "./models/doctor.js";

async function seedUsers() {
  try {
    await connectDatabase();

    console.log("Starting MediTrack demo data setup...");

    /*
    |--------------------------------------------------------------------------
    | DEMO PATIENT + ADMIN
    |--------------------------------------------------------------------------
    */

    const basicUsers = [
      {
        name: "MediTrack Patient",
        email: "patient@meditrack.demo",
        phone: "9876543210",
        password: "Password@123",
        role: "patient",
        accountStatus: "active",
        emailVerified: true,
        doctorVerification: "not_applicable",
      },

      {
        name: "MediTrack Administrator",
        email: "admin@meditrack.demo",
        phone: "9876543212",
        password: "Password@123",
        role: "admin",
        accountStatus: "active",
        emailVerified: true,
        doctorVerification: "not_applicable",
      },
    ];

    /*
    |--------------------------------------------------------------------------
    | DEMO DOCTORS
    |--------------------------------------------------------------------------
    */

    const doctors = [
      {
        name: "Dr. Priya Sharma",
        email: "doctor@meditrack.demo",
        phone: "9876543211",
        specialization: "Dermatology",
        specialty: "Dermatology",
        hospital: "Apollo Medical Centre",
        medicalRegistrationNumber: "DEMO-MED-2026-001",
        experience: 12,
        qualification: "MBBS, MD Dermatology",
        consultationFee: 800,
        languages: [
          "English",
          "Tamil",
          "Hindi",
        ],
        bio:
          "Experienced dermatologist specializing in skin, hair and common dermatological conditions with a patient-focused approach.",
        visitTypes: [
          "in-person",
          "video",
        ],
        availableDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Friday",
          "Saturday",
        ],
        consultationDuration: 30,
        availability: [
          {
            day: "Monday",
            slots: [
              "09:00 AM",
              "09:30 AM",
              "10:00 AM",
              "10:30 AM",
              "11:00 AM",
            ],
          },
          {
            day: "Tuesday",
            slots: [
              "02:00 PM",
              "02:30 PM",
              "03:00 PM",
              "03:30 PM",
              "04:00 PM",
            ],
          },
          {
            day: "Wednesday",
            slots: [
              "09:00 AM",
              "09:30 AM",
              "10:00 AM",
              "10:30 AM",
            ],
          },
        ],
        rating: 4.8,
        totalReviews: 124,
      },

      {
        name: "Dr. Arun Kumar",
        email: "arun.kumar@meditrack.demo",
        phone: "9876543221",
        specialization: "Cardiology",
        specialty: "Cardiology",
        hospital: "City Heart Hospital",
        medicalRegistrationNumber: "DEMO-MED-2026-002",
        experience: 15,
        qualification: "MBBS, MD, DM Cardiology",
        consultationFee: 1200,
        languages: [
          "English",
          "Tamil",
          "Hindi",
        ],
        bio:
          "Cardiologist focused on preventive heart care, cardiovascular risk assessment and long-term cardiac wellness.",
        visitTypes: [
          "in-person",
          "video",
        ],
        availableDays: [
          "Monday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        consultationDuration: 30,
        availability: [
          {
            day: "Monday",
            slots: [
              "04:00 PM",
              "04:30 PM",
              "05:00 PM",
              "05:30 PM",
            ],
          },
          {
            day: "Wednesday",
            slots: [
              "10:00 AM",
              "10:30 AM",
              "11:00 AM",
              "11:30 AM",
            ],
          },
        ],
        rating: 4.9,
        totalReviews: 186,
      },

      {
        name: "Dr. Meera Krishnan",
        email: "meera.krishnan@meditrack.demo",
        phone: "9876543222",
        specialization: "General Medicine",
        specialty: "General Medicine",
        hospital: "MediCare Hospital",
        medicalRegistrationNumber: "DEMO-MED-2026-003",
        experience: 9,
        qualification: "MBBS, MD General Medicine",
        consultationFee: 600,
        languages: [
          "English",
          "Tamil",
          "Malayalam",
        ],
        bio:
          "General physician providing comprehensive primary care, preventive consultations and follow-up management.",
        visitTypes: [
          "in-person",
          "video",
        ],
        availableDays: [
          "Monday",
          "Tuesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        consultationDuration: 30,
        availability: [
          {
            day: "Monday",
            slots: [
              "09:00 AM",
              "09:30 AM",
              "10:00 AM",
              "10:30 AM",
            ],
          },
          {
            day: "Thursday",
            slots: [
              "03:00 PM",
              "03:30 PM",
              "04:00 PM",
              "04:30 PM",
            ],
          },
        ],
        rating: 4.7,
        totalReviews: 98,
      },

      {
        name: "Dr. Rahul Menon",
        email: "rahul.menon@meditrack.demo",
        phone: "9876543223",
        specialization: "Pediatrics",
        specialty: "Pediatrics",
        hospital: "Apollo Medical Centre",
        medicalRegistrationNumber: "DEMO-MED-2026-004",
        experience: 11,
        qualification: "MBBS, MD Pediatrics",
        consultationFee: 700,
        languages: [
          "English",
          "Tamil",
          "Malayalam",
        ],
        bio:
          "Pediatrician focused on child wellness, preventive care, growth monitoring and common childhood conditions.",
        visitTypes: [
          "in-person",
          "video",
        ],
        availableDays: [
          "Tuesday",
          "Wednesday",
          "Friday",
          "Saturday",
        ],
        consultationDuration: 30,
        availability: [
          {
            day: "Tuesday",
            slots: [
              "10:00 AM",
              "10:30 AM",
              "11:00 AM",
              "11:30 AM",
            ],
          },
          {
            day: "Saturday",
            slots: [
              "02:00 PM",
              "02:30 PM",
              "03:00 PM",
              "03:30 PM",
            ],
          },
        ],
        rating: 4.8,
        totalReviews: 141,
      },

      {
        name: "Dr. Kavya Iyer",
        email: "kavya.iyer@meditrack.demo",
        phone: "9876543224",
        specialization: "Orthopedics",
        specialty: "Orthopedics",
        hospital: "MediCare Hospital",
        medicalRegistrationNumber: "DEMO-MED-2026-005",
        experience: 13,
        qualification: "MBBS, MS Orthopedics",
        consultationFee: 900,
        languages: [
          "English",
          "Tamil",
          "Hindi",
        ],
        bio:
          "Orthopedic specialist experienced in musculoskeletal care, joint conditions, mobility concerns and rehabilitation guidance.",
        visitTypes: [
          "in-person",
        ],
        availableDays: [
          "Monday",
          "Wednesday",
          "Thursday",
          "Saturday",
        ],
        consultationDuration: 30,
        availability: [
          {
            day: "Wednesday",
            slots: [
              "05:00 PM",
              "05:30 PM",
              "06:00 PM",
              "06:30 PM",
            ],
          },
          {
            day: "Saturday",
            slots: [
              "09:00 AM",
              "09:30 AM",
              "10:00 AM",
              "10:30 AM",
            ],
          },
        ],
        rating: 4.6,
        totalReviews: 87,
      },

      {
        name: "Dr. Ananya Rao",
        email: "ananya.rao@meditrack.demo",
        phone: "9876543225",
        specialization: "Gynecology",
        specialty: "Gynecology",
        hospital: "Women's Care Centre",
        medicalRegistrationNumber: "DEMO-MED-2026-006",
        experience: 14,
        qualification: "MBBS, MS Obstetrics & Gynecology",
        consultationFee: 1000,
        languages: [
          "English",
          "Tamil",
          "Telugu",
          "Hindi",
        ],
        bio:
          "Gynecologist providing comprehensive women's health consultations, preventive care and reproductive health guidance.",
        visitTypes: [
          "in-person",
          "video",
        ],
        availableDays: [
          "Tuesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        consultationDuration: 30,
        availability: [
          {
            day: "Tuesday",
            slots: [
              "11:00 AM",
              "11:30 AM",
              "12:00 PM",
              "12:30 PM",
            ],
          },
          {
            day: "Friday",
            slots: [
              "03:00 PM",
              "03:30 PM",
              "04:00 PM",
              "04:30 PM",
            ],
          },
        ],
        rating: 4.9,
        totalReviews: 165,
      },

      {
        name: "Dr. Vivek Nair",
        email: "vivek.nair@meditrack.demo",
        phone: "9876543226",
        specialization: "Neurology",
        specialty: "Neurology",
        hospital: "City Heart Hospital",
        medicalRegistrationNumber: "DEMO-MED-2026-007",
        experience: 16,
        qualification: "MBBS, MD, DM Neurology",
        consultationFee: 1300,
        languages: [
          "English",
          "Malayalam",
          "Tamil",
        ],
        bio:
          "Neurologist specializing in neurological assessment, headache care and long-term nervous system health.",
        visitTypes: [
          "in-person",
          "video",
        ],
        availableDays: [
          "Monday",
          "Tuesday",
          "Thursday",
        ],
        consultationDuration: 30,
        availability: [
          {
            day: "Tuesday",
            slots: [
              "02:00 PM",
              "02:30 PM",
              "03:00 PM",
              "03:30 PM",
            ],
          },
          {
            day: "Thursday",
            slots: [
              "10:00 AM",
              "10:30 AM",
              "11:00 AM",
            ],
          },
        ],
        rating: 4.8,
        totalReviews: 112,
      },

      {
        name: "Dr. Sanjay Patel",
        email: "sanjay.patel@meditrack.demo",
        phone: "9876543227",
        specialization: "ENT",
        specialty: "ENT",
        hospital: "Apollo Medical Centre",
        medicalRegistrationNumber: "DEMO-MED-2026-008",
        experience: 10,
        qualification: "MBBS, MS ENT",
        consultationFee: 750,
        languages: [
          "English",
          "Hindi",
          "Tamil",
          "Gujarati",
        ],
        bio:
          "ENT specialist providing consultation for ear, nose and throat conditions with a focus on practical and preventive care.",
        visitTypes: [
          "in-person",
          "video",
        ],
        availableDays: [
          "Monday",
          "Wednesday",
          "Friday",
          "Saturday",
        ],
        consultationDuration: 30,
        availability: [
          {
            day: "Friday",
            slots: [
              "09:00 AM",
              "09:30 AM",
              "10:00 AM",
              "10:30 AM",
            ],
          },
          {
            day: "Saturday",
            slots: [
              "01:00 PM",
              "01:30 PM",
              "02:00 PM",
              "02:30 PM",
            ],
          },
        ],
        rating: 4.7,
        totalReviews: 76,
      },
    ];

    /*
    |--------------------------------------------------------------------------
    | CREATE / UPDATE BASIC USERS
    |--------------------------------------------------------------------------
    */

    for (const demoUser of basicUsers) {
      const existingUser = await User.findOne({
        email: demoUser.email,
      });

      const hashedPassword = await bcrypt.hash(
        demoUser.password,
        12
      );

      if (existingUser) {
        existingUser.name = demoUser.name;
        existingUser.phone = demoUser.phone;
        existingUser.password = hashedPassword;
        existingUser.role = demoUser.role;
        existingUser.accountStatus =
          demoUser.accountStatus;
        existingUser.emailVerified =
          demoUser.emailVerified;
        existingUser.doctorVerification =
          demoUser.doctorVerification;

        await existingUser.save();

        console.log(
          `✓ Updated ${demoUser.role}: ${demoUser.email}`
        );
      } else {
        await User.create({
          ...demoUser,
          password: hashedPassword,
        });

        console.log(
          `✓ Created ${demoUser.role}: ${demoUser.email}`
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE / UPDATE DOCTORS
    |--------------------------------------------------------------------------
    */

    for (const doctorData of doctors) {
      const hashedPassword =
        await bcrypt.hash(
          "Password@123",
          12
        );

      let doctorUser =
        await User.findOne({
          email: doctorData.email,
        });

      if (doctorUser) {
        doctorUser.name = doctorData.name;
        doctorUser.phone = doctorData.phone;
        doctorUser.role = "doctor";
        doctorUser.accountStatus = "active";
        doctorUser.emailVerified = true;
        doctorUser.doctorVerification =
          "verified";
        doctorUser.medicalRegistrationNumber =
          doctorData.medicalRegistrationNumber;
        doctorUser.specialization =
          doctorData.specialization;
        doctorUser.hospital =
          doctorData.hospital;

        await doctorUser.save();

        console.log(
          `✓ Updated doctor user: ${doctorData.email}`
        );
      } else {
        doctorUser = await User.create({
          name: doctorData.name,
          email: doctorData.email,
          phone: doctorData.phone,
          password: hashedPassword,
          role: "doctor",
          accountStatus: "active",
          emailVerified: true,
          doctorVerification: "verified",
          medicalRegistrationNumber:
            doctorData.medicalRegistrationNumber,
          specialization:
            doctorData.specialization,
          hospital: doctorData.hospital,
        });

        console.log(
          `✓ Created doctor user: ${doctorData.email}`
        );
      }

      await Doctor.findOneAndUpdate(
        {
          user: doctorUser._id,
        },
        {
          user: doctorUser._id,

          specialty:
            doctorData.specialty,

          hospital:
            doctorData.hospital,

          experience:
            doctorData.experience,

          qualification:
            doctorData.qualification,

          consultationFee:
            doctorData.consultationFee,

          languages:
            doctorData.languages,

          bio:
            doctorData.bio,

          visitTypes:
            doctorData.visitTypes,

          availableDays:
            doctorData.availableDays,

          consultationDuration:
            doctorData.consultationDuration,

          availability:
            doctorData.availability,

          rating:
            doctorData.rating,

          totalReviews:
            doctorData.totalReviews,

          isAvailable: true,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(
        `✓ Doctor profile ready: ${doctorData.name}`
      );
    }

    console.log("");
    console.log(
      "=============================================="
    );
    console.log(
      "MediTrack appointment demo data ready"
    );
    console.log(
      "=============================================="
    );
    console.log("");

    console.log(
      "Patient : patient@meditrack.demo"
    );

    console.log(
      "Doctors : 8 verified doctor accounts"
    );

    console.log(
      "Admin   : admin@meditrack.demo"
    );

    console.log("");
    console.log(
      "Doctor/Admin/Patient Password: Password@123"
    );

    console.log("");

    process.exit(0);
  } catch (error) {
    console.error(
      "✗ Demo data setup failed:",
      error.message
    );

    process.exit(1);
  }
}

seedUsers();