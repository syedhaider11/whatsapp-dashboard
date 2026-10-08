**WHATSAPP MANAGEMENT DASHBOARD**

**Technical Project Documentation**

Next.js + Supabase + Meta WhatsApp Cloud API

**Project Type: Internal Business / Management Dashboard  
**QR-code WhatsApp scanning is not part of the system.  
WhatsApp numbers are connected through Meta WhatsApp Cloud API
credentials.

# 1. Project Overview

The project is an internal WhatsApp management dashboard designed to
manage a business WhatsApp number through the Meta WhatsApp Cloud API.
The dashboard will provide authentication, role-based access control,
WhatsApp connection management, messaging, contacts, document/PDF
management, templates, notifications, activity logs, and settings.

This is not a SaaS platform. The system is intended for internal
business use and does not require subscription plans, billing, tenant
management, or customer-facing SaaS functionality.

# 2. Main Objectives

- Connect a Meta-generated WhatsApp Business number without QR scanning.

- Allow authorized users to send and receive WhatsApp messages.

- Provide role-based access so different users have different
  permissions.

- Store application data in Supabase PostgreSQL.

- Store PDF documents and other files in Supabase Storage.

- Receive WhatsApp events through Meta Webhooks.

- Provide a secure, organized internal dashboard.

- Maintain activity logs for important user actions.

# 3. Final Technology Stack

| **Technology**                    | **Purpose**                                                    |
|-----------------------------------|----------------------------------------------------------------|
| Next.js                           | Frontend, server-side functionality, API routes/server actions |
| TypeScript                        | Type-safe application development                              |
| Tailwind CSS                      | Dashboard UI and responsive styling                            |
| Supabase Auth                     | Authentication and user sessions                               |
| Supabase PostgreSQL               | Relational application database and SQL                        |
| Supabase Row Level Security (RLS) | Database-level authorization                                   |
| Supabase Storage                  | PDF and document/file storage                                  |
| Supabase Realtime                 | Real-time dashboard updates where required                     |
| Meta WhatsApp Cloud API           | WhatsApp messaging and business number integration             |
| Meta Webhooks                     | Receive incoming messages and WhatsApp events                  |

# 4. High-Level Architecture

The application will use Next.js as the main application layer. Supabase
will provide authentication, PostgreSQL database services, storage, and
optional real-time updates. Meta WhatsApp Cloud API will handle WhatsApp
communication.

Conceptual flow:

- User → Next.js Dashboard → Supabase

- Next.js Server → Meta WhatsApp Cloud API → WhatsApp

- Meta Webhook → Next.js Webhook Endpoint → Supabase → Dashboard

- PDF Upload → Next.js → Supabase Storage

- Document Metadata → Supabase PostgreSQL

# 5. Authentication

Supabase Auth will be used for application authentication.

- Login

- Logout

- Password reset

- Email verification if required

- User profile

- Session management

- Protected dashboard routes

# 6. Role-Based Access Control (RBAC)

RBAC is a core requirement. Users will not receive the same access.
Permissions will be controlled by role and enforced both in the
application and at the database level using Supabase RLS.

| **Feature**         | **Super Admin** | **Admin** | **Manager** | **Employee** |
|---------------------|-----------------|-----------|-------------|--------------|
| Dashboard           | Yes             | Yes       | Yes         | Yes          |
| Connect WhatsApp    | Yes             | Yes       | No          | No           |
| Disconnect WhatsApp | Yes             | Yes       | No          | No           |
| View Messages       | Yes             | Yes       | Yes         | Yes          |
| Send Messages       | Yes             | Yes       | Yes         | Yes          |
| Manage Contacts     | Yes             | Yes       | Yes         | Yes          |
| Upload PDF          | Yes             | Yes       | Yes         | Yes          |
| Delete PDF          | Yes             | Yes       | No          | No           |
| Manage Templates    | Yes             | Yes       | Yes         | View only    |
| Add Users           | Yes             | Yes       | No          | No           |
| Delete Users        | Yes             | Yes       | No          | No           |
| Change Roles        | Yes             | Yes       | No          | No           |
| Activity Logs       | Yes             | Yes       | Yes         | No           |
| System Settings     | Yes             | Yes       | No          | No           |

The exact permissions can be adjusted during implementation. The
important requirement is that the final authorization must not depend
only on hiding UI buttons; unauthorized database operations must also be
blocked.

# 7. WhatsApp Integration

The system will use the Meta WhatsApp Cloud API. It will not use
WhatsApp Web QR-code scanning.

## 7.1 Add WhatsApp Number

The dashboard will provide a form for connecting a Meta-configured
WhatsApp Business number.

- WhatsApp phone number

- Phone Number ID

- WhatsApp Business Account ID (WABA ID)

- Access Token

The connection should be validated server-side before the account is
marked as connected.

## 7.2 WhatsApp Connection Status

- Connected

- Disconnected

- Connecting

- Error

## 7.3 Disconnect WhatsApp

Authorized users will be able to disconnect the configured WhatsApp
account from the dashboard. The action must require confirmation and
must be protected by RBAC.

## 7.4 WhatsApp Webhook

A webhook endpoint will receive incoming messages and relevant events
from Meta. Incoming messages will be validated and stored in the
database so they can appear in the dashboard inbox.

# 8. WhatsApp Inbox and Messaging

- Conversation list

- Open conversation

- Incoming messages

- Outgoing messages

- Unread/read state

- Message timestamps

- Search conversations

- Send text messages

- Send supported media/documents where required

- Message delivery/status information where available from Meta

# 9. Contacts Management

- Customer/contact name

- WhatsApp phone number

- Email if required

- Tags

- Notes

- Last interaction

- Assigned employee/manager if required

- Create, update, search, and delete contact

# 10. PDF / Document Management

PDF files will be stored in Supabase Storage rather than directly inside
PostgreSQL. PostgreSQL will store the document metadata and storage
path.

| **Field**   | **Purpose**                    |
|-------------|--------------------------------|
| id          | Unique document identifier     |
| file_name   | Original/display file name     |
| file_path   | Supabase Storage path          |
| file_size   | File size                      |
| file_type   | MIME/file type                 |
| uploaded_by | User who uploaded the document |
| created_at  | Upload timestamp               |

Recommended bucket: a private Supabase Storage bucket such as
'documents'. Authorized users can receive short-lived signed URLs when
they need to view or download a file.

The system can also support sending a selected PDF through WhatsApp
where the Meta API and the configured business messaging rules support
that operation.

# 11. WhatsApp Message Templates

- Create and manage frequently used messages.

- Store template name, body, variables, status, and metadata.

- Support placeholders such as {{1}}, {{2}}, etc. where applicable.

- Use approved Meta WhatsApp templates where Meta policy requires them.

# 12. Notifications

- New incoming message

- WhatsApp connection error/disconnection

- Important API error

- New user/account event

- Other important system notifications

# 13. Activity / Audit Logs

Important actions should be recorded for accountability.

- User login/logout where appropriate

- WhatsApp connected

- WhatsApp disconnected

- User created/deleted

- Role changed

- PDF uploaded/deleted

- Important settings changed

- Message-related administrative actions

| **Field**   | **Example**                   |
|-------------|-------------------------------|
| id          | Unique log ID                 |
| user_id     | User who performed the action |
| action      | WHATSAPP_DISCONNECTED         |
| target_type | whatsapp_account              |
| target_id   | Target record ID              |
| metadata    | Additional JSON information   |
| created_at  | Timestamp                     |

# 14. Dashboard Overview

The main dashboard should provide a quick operational summary.

- WhatsApp connection status

- Connected phone number

- Total contacts

- Total/unread messages

- Recent conversations

- Recent activity

- Important notifications

# 15. Settings

- Profile settings

- WhatsApp settings

- User management

- Roles and permissions

- Notification preferences

- Document settings

- Security-related settings

# 16. Recommended Database Structure

The initial Supabase PostgreSQL schema can contain the following logical
tables:

| **Table**         | **Purpose**                                 |
|-------------------|---------------------------------------------|
| profiles          | Application user profile data               |
| roles             | Available user roles                        |
| permissions       | Available permissions                       |
| role_permissions  | Maps roles to permissions                   |
| whatsapp_accounts | Connected Meta WhatsApp account information |
| contacts          | Business/customer contacts                  |
| conversations     | WhatsApp conversation records               |
| messages          | Incoming/outgoing message records           |
| documents         | PDF/document metadata                       |
| message_templates | Reusable WhatsApp message templates         |
| notifications     | User/system notifications                   |
| activity_logs     | Administrative and security audit events    |

# 17. Core Relationships

- profiles → roles

- roles → role_permissions → permissions

- whatsapp_accounts → conversations

- conversations → messages

- contacts → conversations

- profiles → documents

- profiles → activity_logs

- profiles → notifications

# 18. Security Requirements

- Use HTTPS in production.

- Protect all dashboard routes with authentication.

- Use Supabase RLS for database-level authorization.

- Do not expose WhatsApp access tokens in client-side code.

- Handle Meta API requests from server-side Next.js code.

- Use private Supabase Storage buckets for sensitive documents.

- Use signed URLs for controlled document access.

- Validate webhook requests according to Meta's webhook requirements.

- Validate and sanitize user input.

- Apply least-privilege permissions.

- Record important administrative actions in audit logs.

# 19. Environment Variables

Sensitive configuration should be stored in environment variables or a
secure server-side secret mechanism.

- NEXT_PUBLIC_SUPABASE_URL

- NEXT_PUBLIC_SUPABASE_ANON_KEY

- SUPABASE_SERVICE_ROLE_KEY (server-side only)

- META_APP_ID

- META_APP_SECRET (server-side only)

- META_ACCESS_TOKEN (server-side only where applicable)

- META_WEBHOOK_VERIFY_TOKEN

- META_PHONE_NUMBER_ID / WABA-related configuration as required

Exact Meta credential requirements may vary by the selected Cloud API
setup. Secrets must never be committed to Git or exposed through browser
JavaScript.

# 20. Suggested Application Pages

- /login

- /dashboard

- /dashboard/whatsapp

- /dashboard/inbox

- /dashboard/contacts

- /dashboard/documents

- /dashboard/templates

- /dashboard/users

- /dashboard/activity-logs

- /dashboard/settings

# 21. Recommended Development Phases

| **Phase** | **Scope**                                                                                                     |
|-----------|---------------------------------------------------------------------------------------------------------------|
| Phase 1   | Project setup, Next.js, TypeScript, Tailwind CSS, Supabase connection, environment configuration.             |
| Phase 2   | Supabase Auth, user profiles, roles, permissions, RLS, protected routes.                                      |
| Phase 3   | Dashboard UI, navigation, overview cards, user/role management.                                               |
| Phase 4   | Meta WhatsApp Cloud API configuration, add-number form, connection validation, connection status, disconnect. |
| Phase 5   | Meta Webhook integration, conversations, incoming messages, outgoing messages, inbox.                         |
| Phase 6   | Contacts, templates, notifications, activity logs.                                                            |
| Phase 7   | Supabase Storage PDF upload/view/download/delete with permission controls.                                    |
| Phase 8   | Security hardening, error handling, testing, deployment, monitoring.                                          |

# 22. Out of Scope / Not Required

- SaaS subscription/billing system

- Multi-tenant organization management

- QR-code WhatsApp Web scanning

- Unrelated payment/subscription features

- Separate database such as MongoDB or MySQL

- A separate file-storage platform unless future requirements justify it

# 23. Final Project Definition

The final product is an internal WhatsApp Management Dashboard built
with Next.js and Supabase. It connects a Meta-configured WhatsApp
Business number through the Meta WhatsApp Cloud API rather than through
QR scanning. The system includes authentication, role-based access
control, WhatsApp messaging, contacts, PDF/document storage, templates,
notifications, audit logs, and settings. Supabase provides PostgreSQL,
authentication, storage, real-time capabilities, and database-level
security through RLS.

# 24. Final Stack Summary

| **Layer**      | **Final Choice**                                |
|----------------|-------------------------------------------------|
| Frontend       | Next.js + TypeScript                            |
| UI             | Tailwind CSS                                    |
| Authentication | Supabase Auth                                   |
| Database       | Supabase PostgreSQL / SQL                       |
| Authorization  | RBAC + Supabase RLS                             |
| File Storage   | Supabase Storage                                |
| Realtime       | Supabase Realtime                               |
| WhatsApp       | Meta WhatsApp Cloud API                         |
| Events         | Meta Webhooks                                   |
| Deployment     | Suitable Next.js/Supabase production deployment |

**End of Documentation**
