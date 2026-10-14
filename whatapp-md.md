**WHATSAPP MANAGEMENT DASHBOARD**

**Technical Project Documentation**

Next.js + Local PostgreSQL + ChromaDB + Meta WhatsApp Cloud API

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

- Store application data, user accounts, authentication records, and role permissions in a locally hosted PostgreSQL database.

- Store PDF files in a private local filesystem directory and store their metadata in PostgreSQL.

- Receive WhatsApp events through Meta Webhooks.

- Provide a secure, organized internal dashboard.

- Maintain activity logs for important user actions.

# 3. Final Technology Stack

| **Technology**                    | **Purpose**                                                    |
|-----------------------------------|----------------------------------------------------------------|
| Next.js                           | Frontend, server-side functionality, API routes/server actions |
| TypeScript                        | Type-safe application development                              |
| Tailwind CSS                      | Dashboard UI and responsive styling                            |
| Local authentication module       | Login, logout, password hashing, sessions, and password reset   |
| Local PostgreSQL                  | Relational application database, user records, and SQL          |
| RBAC authorization layer          | Role and permission checks in server-side routes/actions        |
| Local file storage                | Uploaded PDF and document files                                 |
| ChromaDB                          | Vector storage and semantic retrieval for PDF content / RAG     |
| Server-Sent Events or polling     | Optional dashboard updates where required                       |
| Meta WhatsApp Cloud API           | WhatsApp messaging and business number integration             |
| Meta Webhooks                     | Receive incoming messages and WhatsApp events                  |

# 4. High-Level Architecture

The application will use Next.js as the main application layer. A locally hosted PostgreSQL instance will store application data, user accounts, authentication-related records, and RBAC information. Uploaded PDFs will be stored on the local server filesystem, while ChromaDB will store embeddings and text chunks used for semantic retrieval in the RAG workflow. Meta WhatsApp Cloud API will handle WhatsApp communication.

Conceptual flow:

- User → Next.js Dashboard → Next.js server-side authentication → Local PostgreSQL

- Next.js Server → Meta WhatsApp Cloud API → WhatsApp

- Meta Webhook → Next.js Webhook Endpoint → Local PostgreSQL → Dashboard

- PDF Upload → Next.js → Local file storage

- Document Metadata → Local PostgreSQL

- PDF Text → Chunking → Embedding Model → ChromaDB

- User question → Embedding Model → ChromaDB retrieval → Relevant chunks + question → LLM response

# 5. Authentication

Application authentication will be implemented in the Next.js server layer and backed by local PostgreSQL. User passwords must be stored only as strong salted password hashes (never plaintext). Use secure, HTTP-only, same-site cookies for sessions, and implement password reset and email verification only if required. Use a well-maintained authentication library rather than writing cryptographic logic from scratch.

- Login

- Logout

- Password reset

- Email verification if required

- User profile

- Session management

- Protected dashboard routes

# 6. Role-Based Access Control (RBAC)

RBAC is a core requirement. Users will not receive the same access.
Permissions will be controlled by role and enforced in server-side route handlers/actions and service functions before every protected operation. PostgreSQL constraints and database permissions should provide additional protection where appropriate; server-side authorization is not used.

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

PDF binary files will be stored in a controlled local filesystem directory rather than inside PostgreSQL. PostgreSQL will store document metadata and the relative file path. Restrict filesystem permissions and never expose the storage directory directly as a public static directory. ChromaDB will store extracted text chunks, embeddings, and document identifiers for semantic search; it is not the primary file store.

| **Field**   | **Purpose**                    |
|-------------|--------------------------------|
| id          | Unique document identifier     |
| file_name   | Original/display file name     |
| file_path   | Relative path in local file storage |
| file_size   | File size                      |
| file_type   | MIME/file type                 |
| uploaded_by | User who uploaded the document |
| created_at  | Upload timestamp               |

Use a private local storage directory such as `storage/documents/`. Serve files through authenticated Next.js server routes that check the user's role before streaming a file. Back up this directory along with the PostgreSQL database.

The system can also support sending a selected PDF through WhatsApp
where the Meta API and the configured business messaging rules support
that operation.

# 11. PDF Search and RAG with ChromaDB

ChromaDB will be used as a vector database for semantic search over uploaded PDF content. It is separate from PostgreSQL and does not replace the relational database.

Recommended workflow:

1. A user uploads a PDF through the dashboard.
2. The server validates the file type and size, then stores the PDF in the private local file directory.
3. PostgreSQL stores the document metadata, uploader, file path, and processing status.
4. A PDF text-extraction library extracts the text. OCR is required if the PDF contains scanned pages without selectable text.
5. The extracted text is divided into smaller chunks.
6. An embedding model converts each chunk into a numeric vector.
7. ChromaDB stores the vectors, text chunks, and metadata such as document ID and page number.
8. When a user asks a question, the question is embedded and ChromaDB retrieves relevant chunks.
9. The retrieved chunks and question are passed to an LLM to generate a grounded response. Where possible, show the source PDF and page references.

PostgreSQL remains the source of truth for users, roles, WhatsApp data, document metadata, and audit logs. ChromaDB stores vector-search data. If a PDF is deleted, the application should also remove its related chunks from ChromaDB.

ChromaDB is not an embedding model or an LLM. The embedding model creates vectors; ChromaDB stores and searches them. The LLM generates the answer. A hosted LLM may require an API key, while a local LLM can be used if configured.

# 12. WhatsApp Message Templates

- Create and manage frequently used messages.

- Store template name, body, variables, status, and metadata.

- Support placeholders such as {{1}}, {{2}}, etc. where applicable.

- Use approved Meta WhatsApp templates where Meta policy requires them.

# 13. Notifications

- New incoming message

- WhatsApp connection error/disconnection

- Important API error

- New user/account event

- Other important system notifications

# 14. Activity / Audit Logs

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

# 15. Dashboard Overview

The main dashboard should provide a quick operational summary.

- WhatsApp connection status

- Connected phone number

- Total contacts

- Total/unread messages

- Recent conversations

- Recent activity

- Important notifications

# 16. Settings

- Profile settings

- WhatsApp settings

- User management

- Roles and permissions

- Notification preferences

- Document settings

- Security-related settings

# 17. Recommended Database Structure

The local PostgreSQL schema can contain the following logical tables:

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

# 18. Core Relationships

- profiles → roles

- roles → role_permissions → permissions

- whatsapp_accounts → conversations

- conversations → messages

- contacts → conversations

- profiles → documents

- profiles → activity_logs

- profiles → notifications

# 19. Security Requirements

- Use HTTPS in production.

- Protect all dashboard routes with authentication.

- Enforce authorization on the server for every protected operation; do not rely only on hiding UI elements.

- Do not expose WhatsApp access tokens in client-side code.

- Handle Meta API requests from server-side Next.js code.

- Keep uploaded PDFs in a private local directory and serve them only through authenticated, permission-checked routes.

- Validate webhook requests according to Meta's webhook requirements.

- Validate and sanitize user input.

- Apply least-privilege permissions.

- Record important administrative actions in audit logs.

# 20. Environment Variables

Sensitive configuration should be stored in environment variables or a
secure server-side secret mechanism.

- DATABASE_URL (local PostgreSQL connection string; server-side only)

- AUTH_SESSION_SECRET (strong random secret; server-side only)

- CHROMA_URL (local ChromaDB service URL, if running as a service)

- LLM_API_KEY (only if using a hosted LLM; server-side only)

- EMBEDDING_MODEL (embedding model name/configuration)

- META_APP_ID

- META_APP_SECRET (server-side only)

- META_ACCESS_TOKEN (server-side only where applicable)

- META_WEBHOOK_VERIFY_TOKEN

- META_PHONE_NUMBER_ID / WABA-related configuration as required

Exact Meta credential requirements may vary by the selected Cloud API
setup. Secrets must never be committed to Git or exposed through browser
JavaScript.

# 21. Suggested Application Pages

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

# 22. Recommended Development Phases

| **Phase** | **Scope**                                                                                                     |
|-----------|---------------------------------------------------------------------------------------------------------------|
| Phase 1   | Project setup, Next.js, TypeScript, Tailwind CSS, local PostgreSQL and ChromaDB configuration.             |
| Phase 2   | Authentication backed by local PostgreSQL, password hashing, sessions, user profiles, roles, permissions, and protected routes.                                      |
| Phase 3   | Dashboard UI, navigation, overview cards, user/role management.                                               |
| Phase 4   | Meta WhatsApp Cloud API configuration, add-number form, connection validation, connection status, disconnect. |
| Phase 5   | Meta Webhook integration, conversations, incoming messages, outgoing messages, inbox.                         |
| Phase 6   | Contacts, templates, notifications, activity logs.                                                            |
| Phase 7   | Local PDF upload/view/download/delete with permission checks, metadata in PostgreSQL, text extraction, chunking, embeddings, and ChromaDB indexing.                                    |
| Phase 8   | Security hardening, error handling, testing, deployment, monitoring.                                          |

# 23. Out of Scope / Not Required

- SaaS subscription/billing system

- Multi-tenant organization management

- QR-code WhatsApp Web scanning

- Unrelated payment/subscription features

- Supabase, MongoDB, or MySQL

- Cloud file storage unless future requirements justify it

# 24. Final Project Definition

The final product is an internal WhatsApp Management Dashboard built with Next.js, local PostgreSQL, and ChromaDB. It connects a Meta-configured WhatsApp Business number through the Meta WhatsApp Cloud API rather than QR scanning. The system includes authentication backed by local PostgreSQL, role-based access control, WhatsApp messaging, contacts, local PDF/document storage, templates, notifications, audit logs, and settings. ChromaDB supports vector search over extracted PDF chunks for a RAG-based document question-answering feature, if that feature is enabled.

# 25. Final Stack Summary

| **Layer**      | **Final Choice**                                |
|----------------|-------------------------------------------------|
| Frontend       | Next.js + TypeScript                            |
| UI             | Tailwind CSS                                    |
| Authentication | Next.js server-side auth backed by local PostgreSQL |
| Database       | Local PostgreSQL / SQL                          |
| Authorization  | RBAC enforced in server-side routes/actions     |
| File Storage   | Local private filesystem directory              |
| Vector Database| ChromaDB for embeddings and semantic retrieval  |
| Realtime       | Polling or Server-Sent Events if required       |
| WhatsApp       | Meta WhatsApp Cloud API                         |
| Events         | Meta Webhooks                                   |
| Deployment     | Next.js deployment with access to the local PostgreSQL, ChromaDB, and private file storage services |

**End of Documentation**
