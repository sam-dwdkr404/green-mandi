"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import API from "../../lib/api";
import { getUser, saveUser } from "../../lib/auth";
import { useLanguage } from "../../lib/LanguageContext";
import { TRANSLATIONS } from "../../lib/constants";

const ROLE_CONFIG = {
  farmer: {
    labelKey: "farmer",
    contactLabelKey: "phoneNumber",
    contactKey: "phone",
    placeholderKey: "enterPhoneNumber",
    defaultLocation: "Nipani",
    helperKey: "farmerHelper",
  },
  buyer: {
    labelKey: "retailBuyer",
    contactLabelKey: "emailAddress",
    contactKey: "email",
    placeholderKey: "enterBuyerEmail",
    defaultLocation: "Belagavi",
    helperKey: "buyerHelper",
  },
};



function destinationForRole(role) {
  return role === "farmer" ? "/farmer" : "/buyers";
}

function readRequestError(requestError) {
  const responseData = requestError.response?.data;

  if (typeof responseData === "string") {
    if (responseData.includes("<!DOCTYPE html>")) {
      return "Backend auth route is unavailable. Restart the server and try again.";
    }

    return responseData;
  }

  if (responseData?.error) {
    return responseData.error;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  return "Unable to continue right now.";
}

export default function LoginPage() {
  const router = useRouter();
  const { activeLanguage } = useLanguage();
  const t = TRANSLATIONS[activeLanguage];
  
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("farmer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("Nipani");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roleConfig = ROLE_CONFIG[role];

  useEffect(() => {
    const existingUser = getUser();

    if (existingUser?.role) {
      router.replace(destinationForRole(existingUser.role));
    }
  }, [router]);

  useEffect(() => {
    setLocation(roleConfig.defaultLocation);
  }, [roleConfig.defaultLocation]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        role,
        phone: phone.trim(),
        email: email.trim(),
      };

      let response;

      if (mode === "register") {
        response = await API.post("/auth/register", {
          ...payload,
          name: name.trim(),
          location: location.trim(),
        });
      } else {
        response = await API.post("/auth/login", payload);
      }

      saveUser(response.data);
      router.push(destinationForRole(response.data.role));
    } catch (requestError) {
      setError(readRequestError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#121212]">
      <section className="border-y border-[#888]/40 bg-[#efefef]">
        <div className="mx-auto max-w-[1520px] px-4 lg:px-10">
          <div className="flex min-h-[148px] flex-col justify-center gap-5 py-4">
            <div className="hidden items-center justify-between gap-6 lg:flex">
              <div className="flex min-w-0 flex-1 justify-start">
                <Link href="/" className="text-[18px] font-semibold text-black hover:text-[#5c9d3d] transition-colors">
                  &larr; {t.backToMarketplace}
                </Link>
              </div>

              <div className="px-4 text-center">
                <p className="text-[30px] font-semibold uppercase tracking-[0.12em] text-[#5c9d3d]">
                  Green Mandi
                </p>
                <p className="text-[14px] text-[#8b8b8b]">Beyond farming in Nippani</p>
              </div>

              <div className="flex min-w-0 flex-1 justify-end"></div>
            </div>

            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div>
                <p className="text-[24px] font-semibold uppercase tracking-[0.08em] text-[#5c9d3d]">
                  Green Mandi
                </p>
                <p className="text-[12px] text-[#8b8b8b]">Beyond farming in Nippani</p>
              </div>
              <Link
                href="/"
                className="rounded-full bg-[#67ad45] px-4 py-2 text-sm font-bold text-white"
              >
                {t.home}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate min-h-[calc(100vh-150px)] overflow-hidden">
        <Image
          src="/images/farm-bg.jpg"
          alt="Green Mandi login background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.45)]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-150px)] max-w-[1520px] items-center justify-center px-4 py-10">
          <div className="w-full max-w-[420px] rounded-[22px] border border-white/40 bg-white/92 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] uppercase tracking-[0.3em] text-[#6ca046]">Green Mandi</p>
                <h1 className="mt-3 text-[34px] font-semibold leading-tight text-[#233022]">
                  {mode === "login" ? t.login : t.register}
                </h1>
              </div>

              <div className="flex rounded-full bg-[#eef2e8] p-1">
                {[
                  ["login", t.login],
                  ["register", t.register],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      mode === value ? "bg-[#5fa43a] text-white" : "text-[#4c5a49]"
                    }`}
                    onClick={() => setMode(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#66725f]">
              {t.continueNetwork}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#5fa43a]">
              {t.lowNetwork}
            </p>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-semibold text-[#475346]">
                {t.selectRole}
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="rounded-[12px] border border-[#d7ddd1] bg-white px-4 py-3 outline-none"
                >
                  <option value="farmer">{t.farmer}</option>
                  <option value="buyer">{t.retailBuyer}</option>
                </select>
              </label>

              {mode === "register" ? (
                <label className="grid gap-2 text-sm font-semibold text-[#475346]">
                  {t.fullName}
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={role === "farmer" ? "Ravi Patil" : "Urban Fresh Mart"}
                    className="rounded-[12px] border border-[#d7ddd1] bg-white px-4 py-3 outline-none"
                  />
                </label>
              ) : null}

              <label className="grid gap-2 text-sm font-semibold text-[#475346]">
                {t[roleConfig.contactLabelKey]}
                <input
                  value={roleConfig.contactKey === "phone" ? phone : email}
                  onChange={(event) =>
                    roleConfig.contactKey === "phone"
                      ? setPhone(event.target.value)
                      : setEmail(event.target.value)
                  }
                  placeholder={t[roleConfig.placeholderKey]}
                  className="rounded-[12px] border border-[#d7ddd1] bg-white px-4 py-3 outline-none"
                />
              </label>

              {mode === "register" ? (
                <>
                  {roleConfig.contactKey === "phone" ? (
                    <label className="grid gap-2 text-sm font-semibold text-[#475346]">
                      {t.emailAddress}
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t.optionalEmail}
                        className="rounded-[12px] border border-[#d7ddd1] bg-white px-4 py-3 outline-none"
                      />
                    </label>
                  ) : (
                    <label className="grid gap-2 text-sm font-semibold text-[#475346]">
                      {t.phoneNumber}
                      <input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder={t.optionalBuyerPhone}
                        className="rounded-[12px] border border-[#d7ddd1] bg-white px-4 py-3 outline-none"
                      />
                    </label>
                  )}

                  <label className="grid gap-2 text-sm font-semibold text-[#475346]">
                    {t.location}
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Nipani"
                      className="rounded-[12px] border border-[#d7ddd1] bg-white px-4 py-3 outline-none"
                    />
                  </label>
                </>
              ) : null}

              <p className="text-xs leading-5 text-[#7b8577]">{t[roleConfig.helperKey]}</p>

              {error ? (
                <div className="rounded-[12px] bg-[#fff1f1] px-4 py-3 text-sm text-[#aa3333]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="rounded-[10px] bg-[#5fa43a] px-5 py-4 text-base font-bold text-white disabled:opacity-70"
                disabled={submitting}
              >
                {submitting
                  ? mode === "login"
                    ? t.loggingIn
                    : t.creatingAccount
                  : mode === "login"
                    ? `${t.continueAs} ${t[roleConfig.labelKey]}`
                    : `${t.registerAs} ${t[roleConfig.labelKey]}`}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <button
                type="button"
                className="font-semibold text-[#5fa43a]"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? t.newUserRegister : t.alreadyRegisteredLogin}
              </button>
              <Link href="/" className="font-semibold text-[#364237]">
                {t.backToMarketplace}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
