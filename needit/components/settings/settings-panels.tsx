"use client";

import {
  closeAccount,
  updateBuying,
  updateEmail,
  updateNotifications,
  updatePassword,
  updatePrivacy,
  updateProfile,
  updateSelling,
  updateUsername,
} from "@/app/settings/actions";
import { SPORTS } from "@/lib/board-filters";
import {
  Field,
  SettingsSection,
  Toggle,
  inputClass,
} from "@/components/settings/settings-section";

export type ProfileSettings = {
  username: string;
  display_name: string | null;
  email: string;
  email_notifications: boolean;
  notify_offer_received: boolean;
  notify_counter: boolean;
  notify_your_move: boolean;
  notify_offer_decided: boolean;
  notify_match: boolean;
  notify_demand_match: boolean;
  notify_expiring: boolean;
  notify_digest: boolean;
  notify_product: boolean;
  is_seller: boolean;
  ships_from_state: string | null;
  handling_time_days: number | null;
  default_expiry_hours: number | null;
  default_sport: string | null;
  default_private: boolean;
  profile_public: boolean;
  allow_indexing: boolean;
};

/* ------------------------------- Account -------------------------------- */

export function AccountPanels({ p }: { p: ProfileSettings }) {
  return (
    <>
      <SettingsSection
        id="profile"
        title="Your profile"
        description="How you appear on the board. Your real name is never shown."
        action={updateProfile}
      >
        <Field
          label="Display name (optional)"
          hint="Shown next to your username. Leave blank to just be @your-username."
        >
          <input
            name="display_name"
            defaultValue={p.display_name ?? ""}
            maxLength={40}
            placeholder="e.g. Kyle V."
            className={inputClass}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        id="username"
        title="Username"
        description="This is your identity on Exprifi. You can change it once every 30 days — your reputation is attached to it."
        action={updateUsername}
        saveLabel="Change username"
      >
        <Field
          label="Username"
          hint="3–20 characters. Letters, numbers and underscores only."
        >
          <input
            name="username"
            defaultValue={p.username}
            maxLength={20}
            className={inputClass}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        id="email"
        title="Email address"
        description="Used for sign-in and notifications. Never shown to other members."
        action={updateEmail}
        saveLabel="Change email"
      >
        <Field
          label="Email"
          hint="We'll send a confirmation link to both your old and new address."
        >
          <input
            name="email"
            type="email"
            defaultValue={p.email}
            className={inputClass}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        id="password"
        title="Password"
        action={updatePassword}
        saveLabel="Update password"
      >
        <Field label="New password" hint="At least 10 characters.">
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
      </SettingsSection>
    </>
  );
}

/* ----------------------------- Notifications ----------------------------- */

const EVENTS: { name: keyof ProfileSettings; label: string; hint: string }[] = [
  {
    name: "notify_offer_received",
    label: "Someone offers on my need",
    hint: "The one most people care about.",
  },
  {
    name: "notify_counter",
    label: "Someone counters my price",
    hint: "",
  },
  {
    name: "notify_your_move",
    label: "It's my turn to respond",
    hint: "A reminder when a negotiation is waiting on you.",
  },
  {
    name: "notify_offer_decided",
    label: "My offer is accepted or declined",
    hint: "",
  },
  { name: "notify_match", label: "A deal is matched", hint: "" },
  {
    name: "notify_demand_match",
    label: "A buyer wants something I have",
    hint: "From your saved demand alerts.",
  },
  {
    name: "notify_expiring",
    label: "My need is about to expire",
    hint: "Sent 12 hours before it closes.",
  },
  {
    name: "notify_digest",
    label: "Weekly round-up of hot needs",
    hint: "",
  },
  {
    name: "notify_product",
    label: "News about Exprifi itself",
    hint: "New features and changes. Off by default.",
  },
];

export function NotificationsPanel({ p }: { p: ProfileSettings }) {
  return (
    <SettingsSection
      id="notifications"
      title="Email notifications"
      description="In-app notifications always stay on — this only controls what reaches your inbox."
      action={updateNotifications}
    >
      <Toggle
        name="email_notifications"
        label="Send me emails"
        hint="Master switch. Turn this off and nothing below sends, no matter what it says."
        defaultChecked={p.email_notifications}
      />
      <div className="flex flex-col gap-1 border-l-2 border-border pl-4">
        {EVENTS.map((e) => (
          <Toggle
            key={e.name}
            name={e.name}
            label={e.label}
            hint={e.hint || undefined}
            defaultChecked={Boolean(p[e.name])}
          />
        ))}
      </div>
    </SettingsSection>
  );
}

/* -------------------------------- Buying -------------------------------- */

export function BuyingPanel({ p }: { p: ProfileSettings }) {
  return (
    <SettingsSection
      id="buying"
      title="Posting defaults"
      description="Prefills the post-a-need form. You can always change them on any individual need."
      action={updateBuying}
    >
      <Field label="How long needs stay open">
        <select
          name="default_expiry_hours"
          defaultValue={p.default_expiry_hours ?? ""}
          className={inputClass}
        >
          <option value="">No default — ask me each time</option>
          <option value="24">24 hours</option>
          <option value="72">3 days</option>
          <option value="168">7 days</option>
        </select>
      </Field>

      <Field label="Usual category">
        <select
          name="default_sport"
          defaultValue={p.default_sport ?? ""}
          className={inputClass}
        >
          <option value="">No default</option>
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Toggle
        name="default_private"
        label="Save new needs privately first"
        hint="They go to your wishlist instead of straight to the board, so you can publish when you're ready."
        defaultChecked={p.default_private}
      />
    </SettingsSection>
  );
}

/* -------------------------------- Selling ------------------------------- */

export function SellingPanel({ p }: { p: ProfileSettings }) {
  return (
    <SettingsSection
      id="selling"
      title="Selling"
      description="Every account can buy. Turn selling on to answer open needs — you can turn it off again any time."
      action={updateSelling}
    >
      <Toggle
        name="is_seller"
        label="I want to sell on Exprifi"
        hint="Unlocks sending offers and saving demand alerts. Free — sellers keep 100% of the sale price."
        defaultChecked={p.is_seller}
      />

      <Field
        label="Ships from"
        hint="Helps buyers judge delivery time. State or region is enough — never your address."
      >
        <input
          name="ships_from_state"
          defaultValue={p.ships_from_state ?? ""}
          maxLength={40}
          placeholder="e.g. Connecticut"
          className={inputClass}
        />
      </Field>

      <Field
        label="Usual handling time (days)"
        hint="How long you normally take to ship after a deal is agreed."
      >
        <input
          name="handling_time_days"
          type="number"
          min={1}
          max={30}
          inputMode="numeric"
          defaultValue={p.handling_time_days ?? ""}
          placeholder="2"
          className={inputClass}
        />
      </Field>
    </SettingsSection>
  );
}

/* -------------------------------- Privacy ------------------------------- */

export function PrivacyPanel({ p }: { p: ProfileSettings }) {
  return (
    <SettingsSection
      id="privacy"
      title="Privacy"
      description="You're pseudonymous by default. Your identity is only shared with a counterparty once you agree a deal."
      action={updatePrivacy}
    >
      <Toggle
        name="profile_public"
        label="Let anyone view my profile page"
        hint="Turn off and only signed-in members can see your open needs and deal history."
        defaultChecked={p.profile_public}
      />
      <Toggle
        name="allow_indexing"
        label="Let search engines index my profile"
        hint="Being findable brings sellers to your needs. Turn off if you'd rather stay off Google."
        defaultChecked={p.allow_indexing}
      />
    </SettingsSection>
  );
}

/* ------------------------------ Close account ---------------------------- */

export function CloseAccountPanel({ username }: { username: string }) {
  return (
    <SettingsSection
      id="close"
      title="Close your account"
      description="Your profile is hidden and your open needs come off the board straight away. Completed deals are kept as a record for the people you traded with. Email support@exprifi.com within 14 days if you change your mind."
      action={closeAccount}
      saveLabel="Close my account"
      tone="danger"
    >
      <Field label={`Type "${username}" to confirm`}>
        <input
          name="confirm_username"
          autoComplete="off"
          placeholder={username}
          className={inputClass}
        />
      </Field>
    </SettingsSection>
  );
}
