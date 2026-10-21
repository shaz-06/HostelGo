import { t as e } from "./arrow-left-YKanc6VY.js";
import { t } from "./chevron-right-B0G87RzA.js";
import { t as n } from "./plus-DcUFUddv.js";
import { t as ee } from "./share-2-B3dkPQt4.js";
import { t as te } from "./triangle-alert-NKXVYxkw.js";
import {
  K as r,
  W as i,
  f as a,
  g as o,
  j as s,
  k as c,
  p as l,
  z as u,
} from "./index-D2EfKH85.js";
import d from "./AddressSelectorModal-C-42m_Fe.js";
var f = o(`ellipsis`, [
    [`circle`, { cx: `12`, cy: `12`, r: `1`, key: `41hilf` }],
    [`circle`, { cx: `19`, cy: `12`, r: `1`, key: `1wjl8i` }],
    [`circle`, { cx: `5`, cy: `12`, r: `1`, key: `1pcz8c` }],
  ]),
  p = o(`pin`, [
    [`path`, { d: `M12 17v5`, key: `bb1du9` }],
    [
      `path`,
      {
        d: `M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z`,
        key: `1nkz8b`,
      },
    ],
  ]),
  m = r(i(), 1),
  h = s(),
  ne = () =>
    (0, h.jsx)(`img`, {
      src: `https://img.icons8.com/?size=100&id=DUEq8l5qTqBE&format=png&color=000000`,
      alt: `Request Address`,
      className: `w-8 h-8 object-contain`,
    }),
  re = () =>
    (0, h.jsx)(`div`, {
      className: `w-8 h-8 rounded-lg bg-[#CB202D] flex items-center justify-center text-white font-sans text-[10px] font-black italic`,
      children: `zomato`,
    });
function g() {
  let r = u(),
    {
      user: i,
      token: o,
      refreshUser: s,
    } = (0, m.useContext)(c) || { user: null },
    [g, ie] = (0, m.useState)(!1),
    [ae, _] = (0, m.useState)(!1),
    [v, y] = (0, m.useState)(!1),
    [b, x] = (0, m.useState)(!0),
    [S, C] = (0, m.useState)(``),
    [w, T] = (0, m.useState)(!1),
    E = (e) => {
      C(e), setTimeout(() => C(``), 3e3);
    },
    D = async (e) => {
      if (!w) {
        T(!0);
        try {
          let t = `My Buyto delivery address:\n${`${
            e.houseNumber || e.addressLine || ``
          }, ${e.area || ``}, ${e.landmark ? `Near ` + e.landmark : ``}, ${
            e.city || `Bengaluru`
          }, ${e.state || `Karnataka`} ${e.zip || ``}`
            .replace(/,\s*,/g, `,`)
            .replace(/^,\s*/, ``)}`;
          e.latitude !== void 0 &&
            e.longitude !== void 0 &&
            Number.isFinite(Number(e.latitude)) &&
            Number.isFinite(Number(e.longitude)) &&
            (t += `\n\nLocation:\nhttps://www.google.com/maps?q=${e.latitude},${e.longitude}`),
            navigator.share
              ? await navigator.share({ title: `My Buyto Address`, text: t })
              : (await navigator.clipboard.writeText(t), E(`Address copied ✓`));
        } catch (e) {
          e.name !== `AbortError` &&
            (console.error(`Address sharing failed:`, e),
            E(`Unable to share address`));
        } finally {
          T(!1);
        }
      }
    },
    [O, k] = (0, m.useState)([]),
    [oe, A] = (0, m.useState)(!0),
    [j, M] = (0, m.useState)(
      () => localStorage.getItem(`buyto_selected_address_id`) || ``,
    ),
    [N, P] = (0, m.useState)(null),
    [F, I] = (0, m.useState)(null),
    [L, R] = (0, m.useState)(``),
    [z, B] = (0, m.useState)(``),
    [V, H] = (0, m.useState)(``),
    [U, W] = (0, m.useState)(``),
    [G, K] = (0, m.useState)(``),
    [q, J] = (0, m.useState)(``),
    [Y, X] = (0, m.useState)(``),
    Z = (0, m.useCallback)(async () => {
      if (!o) {
        A(!1);
        return;
      }
      try {
        let e = await fetch(`${window.API_BASE_URL}/api/addresses`, {
          headers: { Authorization: `Bearer ${o}` },
        });
        if (e.ok) {
          let t = await e.json();
          if (t.success && t.addresses) {
            k(t.addresses);
            let e = localStorage.getItem(`buyto_selected_address_id`);
            if (!e && t.addresses.length > 0) {
              let e = t.addresses.find((e) => e.isDefault) || t.addresses[0];
              M(e._id),
                localStorage.setItem(`buyto_selected_address_id`, e._id);
            } else e && M(e);
          }
        }
      } catch (e) {
        console.error(`Error loading addresses:`, e);
      } finally {
        A(!1);
      }
    }, [o]);
  (0, m.useEffect)(() => {
    Z();
  }, [Z]),
    (0, m.useEffect)(() => {
      let e = () => {
        M(localStorage.getItem(`buyto_selected_address_id`) || ``), Z();
      };
      return (
        window.addEventListener(`addressChanged`, e),
        () => window.removeEventListener(`addressChanged`, e)
      );
    }, [Z]),
    (0, m.useEffect)(() => {
      let e = () => {
        _(window.scrollY > 5);
      };
      return (
        window.addEventListener(`scroll`, e),
        () => window.removeEventListener(`scroll`, e)
      );
    }, []);
  let se = () => {
      ie(!0),
        setTimeout(() => {
          r(`/profile`);
        }, 280);
    },
    ce = () => {
      y(!0);
    },
    le = () => {
      y(!1), Z(), s && o && s();
    },
    ue = async (e) => {
      let t = e.addressLine + (e.landmark ? `, ${e.landmark}` : ``);
      if (
        (localStorage.setItem(`userLocation`, t),
        localStorage.setItem(`roomNumber`, e.roomNumber || ``),
        localStorage.setItem(`buyto_selected_address_id`, e._id),
        localStorage.setItem(
          `buyto_selected_address_type`,
          e.label || e.addressType || `Other`,
        ),
        localStorage.setItem(`buyto_selected_address_full`, JSON.stringify(e)),
        M(e._id),
        o && e._id && !e._id.startsWith(`fallback`))
      )
        try {
          await fetch(`${window.API_BASE_URL}/api/addresses/${e._id}/default`, {
            method: `POST`,
            headers: { Authorization: `Bearer ${o}` },
          });
        } catch (e) {
          console.error(`Error setting default address:`, e);
        }
      window.dispatchEvent(new Event(`addressChanged`));
    },
    Q = (e) => {
      P(null),
        I(e),
        R(e.label || e.addressType || `PG`),
        B(e.addressLine || ``),
        H(e.landmark || ``),
        W(e.roomNumber || ``),
        K(e.phone || ``),
        J(e.fullName || i?.name || ``),
        X(``);
    },
    de = async (e) => {
      if ((e.preventDefault(), !z.trim() || !G.trim() || !q.trim())) {
        X(`Name, Phone, and Address Line are required`);
        return;
      }
      if (!F?._id || F._id.startsWith(`fallback`)) {
        I(null);
        return;
      }
      try {
        let e = {
            label: L,
            addressType: L,
            fullName: q,
            phone: G,
            addressLine: z,
            landmark: V,
            roomNumber: U,
            latitude: F.latitude || 12.9716,
            longitude: F.longitude || 77.5946,
            isDefault: F.isDefault,
            serviceable: !0,
          },
          t = await fetch(`${window.API_BASE_URL}/api/addresses/${F._id}`, {
            method: `PUT`,
            headers: {
              "Content-Type": `application/json`,
              Authorization: `Bearer ${o}`,
            },
            body: JSON.stringify(e),
          });
        if (t.ok) {
          if (
            (I(null),
            Z(),
            localStorage.getItem(`buyto_selected_address_id`) === F._id)
          ) {
            let t = z + (V ? `, ${V}` : ``);
            localStorage.setItem(`userLocation`, t),
              localStorage.setItem(`roomNumber`, U || ``),
              localStorage.setItem(`buyto_selected_address_type`, L),
              localStorage.setItem(
                `buyto_selected_address_full`,
                JSON.stringify({ ...F, ...e }),
              ),
              window.dispatchEvent(new Event(`addressChanged`));
          }
        } else X((await t.json()).message || `Failed to update address`);
      } catch (e) {
        console.error(`Error editing address:`, e),
          X(`Failed to update address details`);
      }
    },
    fe = async (e) => {
      if ((P(null), !e._id || e._id.startsWith(`fallback`))) {
        k([]),
          localStorage.removeItem(`buyto_selected_address_id`),
          window.dispatchEvent(new Event(`addressChanged`));
        return;
      }
      if (window.confirm(`Are you sure you want to delete this address?`))
        try {
          (
            await fetch(`${window.API_BASE_URL}/api/addresses/${e._id}`, {
              method: `DELETE`,
              headers: { Authorization: `Bearer ${o}` },
            })
          ).ok &&
            (Z(),
            localStorage.getItem(`buyto_selected_address_id`) === e._id &&
              (localStorage.removeItem(`buyto_selected_address_id`),
              localStorage.removeItem(`userLocation`),
              localStorage.removeItem(`roomNumber`),
              localStorage.removeItem(`buyto_selected_address_full`),
              window.dispatchEvent(new Event(`addressChanged`))));
        } catch (e) {
          console.error(`Error deleting address:`, e);
        }
    },
    $ =
      O.length > 0
        ? O
        : [
            {
              _id: `fallback-addr-1`,
              addressType: `PG`,
              houseNumber: `SDM Gents Luxury PG`,
              addressLine: `SDM Gents Luxury PG, Sri Sai layout`,
              area: `Next To Hotel Udupi Krishna Theertha`,
              landmark: `Reva Circle`,
              city: `Bengaluru`,
              state: `Karnataka`,
              zip: `560064`,
              phone: `6363849864`,
            },
          ];
  return (0, h.jsxs)(`div`, {
    className: `min-h-screen pb-16 font-sans select-none overflow-x-hidden`,
    style: {
      background: `#F6F7FB`,
      animation: g
        ? `slideOut 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards`
        : `slideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
      width: `100%`,
      maxWidth: `100%`,
      willChange: `transform`,
    },
    children: [
      S &&
        (0, h.jsx)(`div`, {
          className: `fixed top-6 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-6 py-3 rounded-full font-bold text-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] z-[99999] flex items-center gap-2`,
          style: { animation: `fadeIn 0.2s ease` },
          children: S,
        }),
      (0, h.jsx)(`style`, {
        dangerouslySetInnerHTML: {
          __html: `
          @keyframes slideIn {
            from { transform: translate3d(100%, 0, 0); }
            to { transform: translate3d(0, 0, 0); }
          }
          @keyframes slideOut {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(100%, 0, 0); }
          }
          .custom-shadow {
            box-shadow: 0 1px 8px rgba(0, 0, 0, 0.03);
          }
          .custom-border {
            border: 1px solid rgba(0, 0, 0, 0.06);
          }
          .row-active:active {
            background-color: #FAFAFA;
            transform: scale(0.995);
          }
        `,
        },
      }),
      (0, h.jsx)(`header`, {
        className: `sticky top-0 z-50 flex items-center justify-between px-3 py-3.5 bg-white transition-shadow duration-200 ${
          ae
            ? `shadow-[0_4px_12px_rgba(0,0,0,0.04)] border-b border-gray-100`
            : `border-b border-gray-50`
        }`,
        children: (0, h.jsxs)(`div`, {
          className: `flex items-center gap-4`,
          children: [
            (0, h.jsx)(`button`, {
              onClick: se,
              className: `w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-800 transition-colors focus:outline-none`,
              children: (0, h.jsx)(e, { className: `w-5 h-5 stroke-[2.5]` }),
            }),
            (0, h.jsx)(`span`, {
              className: `text-[17px] font-bold text-gray-900 tracking-tight`,
              children: `My addresses`,
            }),
          ],
        }),
      }),
      (0, h.jsxs)(`main`, {
        className: `max-w-md mx-auto px-4 py-5 flex flex-col gap-5`,
        children: [
          (0, h.jsxs)(`section`, {
            className: `bg-white rounded-[18px] custom-shadow border border-gray-50 overflow-hidden divide-y divide-gray-50`,
            children: [
              (0, h.jsxs)(`div`, {
                onClick: ce,
                className: `flex items-center justify-between p-4 row-active cursor-pointer transition-all duration-150`,
                children: [
                  (0, h.jsxs)(`div`, {
                    className: `flex items-center gap-3.5`,
                    children: [
                      (0, h.jsx)(`div`, {
                        className: `w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-[#318616]`,
                        children: (0, h.jsx)(n, {
                          className: `w-5 h-5 stroke-[3]`,
                        }),
                      }),
                      (0, h.jsx)(`span`, {
                        className: `text-[14px] font-bold text-[#318616]`,
                        children: `Add new address`,
                      }),
                    ],
                  }),
                  (0, h.jsx)(t, { className: `w-5 h-5 text-gray-300` }),
                ],
              }),
              (0, h.jsxs)(`div`, {
                onClick: (0, m.useCallback)(
                  () => r(`/profile/request-address`),
                  [r],
                ),
                className: `flex items-center justify-between p-4 row-active cursor-pointer transition-all duration-150`,
                children: [
                  (0, h.jsxs)(`div`, {
                    className: `flex items-center gap-3.5`,
                    children: [
                      (0, h.jsx)(ne, {}),
                      (0, h.jsx)(`span`, {
                        className: `text-[14px] font-bold text-gray-800`,
                        children: `Request address from someone else`,
                      }),
                    ],
                  }),
                  (0, h.jsx)(t, { className: `w-5 h-5 text-gray-300` }),
                ],
              }),
              (0, h.jsxs)(`div`, {
                className: `flex items-center justify-between p-4 row-active cursor-pointer transition-all duration-150`,
                children: [
                  (0, h.jsxs)(`div`, {
                    className: `flex items-center gap-3.5`,
                    children: [
                      (0, h.jsx)(re, {}),
                      (0, h.jsx)(`span`, {
                        className: `text-[14px] font-bold text-gray-800`,
                        children: `Import your addresses from Buyto`,
                      }),
                    ],
                  }),
                  (0, h.jsx)(t, { className: `w-5 h-5 text-gray-300` }),
                ],
              }),
              (0, h.jsxs)(`div`, {
                onClick: (0, m.useCallback)(
                  () => r(`/profile/manage-shares`),
                  [r],
                ),
                className: `flex items-center justify-between p-4 row-active cursor-pointer transition-all duration-150`,
                children: [
                  (0, h.jsxs)(`div`, {
                    className: `flex items-center gap-3.5`,
                    children: [
                      (0, h.jsx)(`div`, {
                        className: `w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600`,
                        children: (0, h.jsx)(ee, {
                          className: `w-4.5 h-4.5 stroke-[2.2]`,
                        }),
                      }),
                      (0, h.jsx)(`span`, {
                        className: `text-[14px] font-bold text-gray-800`,
                        children: `Manage shared addresses`,
                      }),
                    ],
                  }),
                  (0, h.jsx)(t, { className: `w-5 h-5 text-gray-300` }),
                ],
              }),
            ],
          }),
          (0, h.jsxs)(`section`, {
            className: `flex flex-col gap-3`,
            children: [
              (0, h.jsx)(`h2`, {
                className: `text-[13px] font-black text-gray-400 uppercase tracking-wide px-1`,
                children: `Your saved addresses`,
              }),
              $.map((e) => {
                let t = j === e._id || ($.length === 1 && !j),
                  n = `${e.houseNumber || e.addressLine || ``}, ${
                    e.area || ``
                  }, ${e.landmark ? `Near ` + e.landmark : ``}, ${
                    e.city || `Bengaluru`
                  }, ${e.state || `Karnataka`} ${e.zip || ``}`
                    .replace(/,\s*,/g, `,`)
                    .replace(/^,\s*/, ``);
                return (0, h.jsxs)(
                  `div`,
                  {
                    onClick: () => ue(e),
                    className: `bg-white rounded-[20px] p-5 custom-shadow relative flex flex-col gap-4 cursor-pointer transition-all duration-200 border ${
                      t
                        ? `border-[#318616] ring-1 ring-[#318616]`
                        : `border-gray-50 hover:border-gray-200`
                    }`,
                    children: [
                      (0, h.jsx)(`div`, {
                        className: `absolute top-5 right-5 text-gray-300 hover:text-gray-500`,
                        children: (0, h.jsx)(p, {
                          className: `w-4.5 h-4.5 transform rotate-45 stroke-[2.2] ${
                            t ? `text-[#318616]` : `text-gray-300`
                          }`,
                        }),
                      }),
                      (0, h.jsxs)(`div`, {
                        className: `flex gap-4 items-start`,
                        children: [
                          (0, h.jsx)(`div`, {
                            className: `w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                              t
                                ? `bg-green-50 text-[#318616] border-green-100`
                                : `bg-gray-50 text-amber-500 border-gray-100`
                            }`,
                            children: (0, h.jsx)(`img`, {
                              src: `https://img.icons8.com/?size=100&id=XieTOK4V0QEI&format=png&color=000000`,
                              alt: `Location Pin`,
                              className: `w-6 h-6 object-contain`,
                            }),
                          }),
                          (0, h.jsxs)(`div`, {
                            className: `flex flex-col flex-1 pr-4`,
                            children: [
                              (0, h.jsxs)(`div`, {
                                className: `flex items-center gap-2 mb-2`,
                                children: [
                                  (0, h.jsx)(`h3`, {
                                    className: `text-[15px] font-black text-gray-800 leading-none`,
                                    children: e.label || e.addressType || `PG`,
                                  }),
                                  e.isShared
                                    ? (0, h.jsx)(`span`, {
                                        className: `border border-[#318616] text-[#318616] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider`,
                                        children: `Shared`,
                                      })
                                    : t &&
                                      (0, h.jsx)(`span`, {
                                        className: `bg-green-50 text-[#318616] text-[10px] font-extrabold px-1.5 py-0.5 rounded`,
                                        children: `Active`,
                                      }),
                                ],
                              }),
                              (0, h.jsx)(`p`, {
                                className: `text-[12px] font-bold text-gray-400 leading-relaxed mb-1.5`,
                                children: n,
                              }),
                              e.isShared
                                ? (0, h.jsxs)(`span`, {
                                    className: `text-[12px] font-bold text-gray-400`,
                                    children: [
                                      `Shared by: `,
                                      (0, h.jsx)(`strong`, {
                                        className: `text-gray-700 font-extrabold`,
                                        children: e.sharedBy?.name || `User`,
                                      }),
                                    ],
                                  })
                                : (0, h.jsxs)(`span`, {
                                    className: `text-[12px] font-bold text-gray-400`,
                                    children: [
                                      `Phone number: `,
                                      (0, h.jsx)(`strong`, {
                                        className: `text-gray-700 font-extrabold`,
                                        children: e.phone || `6363849864`,
                                      }),
                                    ],
                                  }),
                            ],
                          }),
                        ],
                      }),
                      (0, h.jsxs)(`div`, {
                        className: `flex items-center gap-2 pl-15`,
                        onClick: (e) => e.stopPropagation(),
                        children: [
                          (0, h.jsx)(`button`, {
                            onClick: () => P(e),
                            className: `w-8 h-8 rounded-full border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors`,
                            children: (0, h.jsx)(f, { className: `w-4 h-4` }),
                          }),
                          (0, h.jsx)(`button`, {
                            onClick: () => D(e),
                            disabled: w,
                            className: `w-8 h-8 rounded-full border border-gray-100 hover:bg-green-50 flex items-center justify-center text-green-600 hover:text-green-700 focus:outline-none transition-colors`,
                            children: (0, h.jsx)(`svg`, {
                              viewBox: `0 0 24 24`,
                              className: `w-4 h-4 fill-none stroke-current stroke-[2.2]`,
                              children: (0, h.jsx)(`path`, {
                                d: `M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13`,
                              }),
                            }),
                          }),
                        ],
                      }),
                      b &&
                        (0, h.jsxs)(`div`, {
                          className: `mt-2 bg-[#FFF9E9] rounded-2xl p-3.5 flex items-center justify-between gap-3 border border-[#FBEAC4]/40 relative`,
                          onClick: (e) => e.stopPropagation(),
                          children: [
                            (0, h.jsx)(`div`, {
                              className: `absolute -top-1.5 left-[84px] w-3 h-3 bg-[#FFF9E9] border-t border-l border-[#FBEAC4]/40 transform rotate-45`,
                            }),
                            (0, h.jsxs)(`div`, {
                              className: `flex items-center gap-3`,
                              children: [
                                (0, h.jsx)(`div`, {
                                  className: `w-7 h-7 bg-white rounded-full flex items-center justify-center text-green-600 flex-shrink-0`,
                                  children: (0, h.jsx)(`svg`, {
                                    viewBox: `0 0 24 24`,
                                    className: `w-4 h-4 fill-none stroke-current stroke-[2.5]`,
                                    children: (0, h.jsx)(`path`, {
                                      d: `M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13`,
                                    }),
                                  }),
                                }),
                                (0, h.jsx)(`span`, {
                                  className: `text-[12px] font-bold text-amber-950 leading-snug`,
                                  children: `Now share your addresses with friends and family`,
                                }),
                              ],
                            }),
                            (0, h.jsx)(`button`, {
                              onClick: () => x(!1),
                              className: `w-6 h-6 rounded-full bg-[#E5D7B7]/40 hover:bg-[#E5D7B7]/60 flex items-center justify-center text-amber-950 focus:outline-none transition-colors`,
                              children: (0, h.jsx)(l, {
                                className: `w-3.5 h-3.5`,
                              }),
                            }),
                          ],
                        }),
                    ],
                  },
                  e._id,
                );
              }),
            ],
          }),
        ],
      }),
      N &&
        (0, h.jsx)(`div`, {
          className: `fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200`,
          onClick: () => P(null),
          children: (0, h.jsxs)(`div`, {
            className: `bg-white rounded-t-[28px] w-full max-w-md p-5 pb-8 flex flex-col gap-4 animate-in slide-in-from-bottom duration-250 ease-out`,
            onClick: (e) => e.stopPropagation(),
            style: { boxShadow: `0 -8px 24px rgba(0, 0, 0, 0.08)` },
            children: [
              (0, h.jsx)(`div`, {
                className: `w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2`,
              }),
              (0, h.jsxs)(`div`, {
                className: `flex flex-col gap-1 px-1`,
                children: [
                  (0, h.jsx)(`h3`, {
                    className: `text-[15px] font-black text-gray-800`,
                    children: `Address Actions`,
                  }),
                  (0, h.jsx)(`p`, {
                    className: `text-[12px] font-bold text-gray-400 truncate`,
                    children: N.addressLine || N.houseNumber || ``,
                  }),
                ],
              }),
              (0, h.jsxs)(`div`, {
                className: `flex flex-col gap-2 mt-2`,
                children: [
                  !N.isShared &&
                    (0, h.jsxs)(`button`, {
                      onClick: () => Q(N),
                      className: `w-full py-4 px-4 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[14px] font-black text-gray-800 flex items-center gap-3 transition-colors text-left`,
                      children: [
                        (0, h.jsx)(`img`, {
                          src: `https://img.icons8.com/?size=100&id=95043&format=png&color=000000`,
                          alt: `Edit`,
                          className: `w-5 h-5 object-contain`,
                        }),
                        ` Edit address`,
                      ],
                    }),
                  (0, h.jsxs)(`button`, {
                    onClick: () => fe(N),
                    className: `w-full py-4 px-4 bg-red-50 hover:bg-red-100 rounded-2xl text-[14px] font-black text-red-600 flex items-center gap-3 transition-colors text-left`,
                    children: [
                      (0, h.jsx)(`img`, {
                        src: `https://img.icons8.com/?size=100&id=XLYyiimvk3fV&format=png&color=000000`,
                        alt: `Delete`,
                        className: `w-5 h-5 object-contain`,
                      }),
                      ` `,
                      N.isShared ? `Remove shared address` : `Delete address`,
                    ],
                  }),
                ],
              }),
              (0, h.jsx)(`button`, {
                onClick: () => P(null),
                className: `w-full py-3.5 bg-gray-900 text-white text-[13px] font-black rounded-xl hover:bg-black transition-colors mt-2`,
                children: `Cancel`,
              }),
            ],
          }),
        }),
      F &&
        (0, h.jsx)(`div`, {
          className: `fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm`,
          children: (0, h.jsxs)(`div`, {
            className: `bg-white rounded-[28px] w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200`,
            children: [
              (0, h.jsx)(`h3`, {
                className: `text-[16px] font-black text-gray-800 mb-1`,
                children: `Edit Address Details`,
              }),
              (0, h.jsx)(`p`, {
                className: `text-[11px] font-bold text-gray-400 mb-4 leading-relaxed`,
                children: `Update details to ensure accurate shipping and delivery.`,
              }),
              (0, h.jsxs)(`form`, {
                onSubmit: de,
                className: `flex flex-col gap-4`,
                children: [
                  (0, h.jsxs)(`div`, {
                    className: `flex flex-col gap-1.5`,
                    children: [
                      (0, h.jsx)(`label`, {
                        className: `text-[10px] font-extrabold text-gray-400 uppercase tracking-wider`,
                        children: `Address Type (e.g. PG, Home)`,
                      }),
                      (0, h.jsx)(`input`, {
                        type: `text`,
                        value: L,
                        onChange: (e) => R(e.target.value),
                        className: `w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500`,
                      }),
                    ],
                  }),
                  (0, h.jsxs)(`div`, {
                    className: `flex flex-col gap-1.5`,
                    children: [
                      (0, h.jsx)(`label`, {
                        className: `text-[10px] font-extrabold text-gray-400 uppercase tracking-wider`,
                        children: `Address Line / Hostel Name`,
                      }),
                      (0, h.jsx)(`input`, {
                        type: `text`,
                        value: z,
                        onChange: (e) => B(e.target.value),
                        className: `w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500`,
                      }),
                    ],
                  }),
                  (0, h.jsxs)(`div`, {
                    className: `grid grid-cols-2 gap-3`,
                    children: [
                      (0, h.jsxs)(`div`, {
                        className: `flex flex-col gap-1.5`,
                        children: [
                          (0, h.jsx)(`label`, {
                            className: `text-[10px] font-extrabold text-gray-400 uppercase tracking-wider`,
                            children: `Room Number`,
                          }),
                          (0, h.jsx)(`input`, {
                            type: `text`,
                            value: U,
                            onChange: (e) => W(e.target.value),
                            className: `w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500`,
                          }),
                        ],
                      }),
                      (0, h.jsxs)(`div`, {
                        className: `flex flex-col gap-1.5`,
                        children: [
                          (0, h.jsx)(`label`, {
                            className: `text-[10px] font-extrabold text-gray-400 uppercase tracking-wider`,
                            children: `Landmark`,
                          }),
                          (0, h.jsx)(`input`, {
                            type: `text`,
                            value: V,
                            onChange: (e) => H(e.target.value),
                            className: `w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500`,
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, h.jsxs)(`div`, {
                    className: `flex flex-col gap-1.5`,
                    children: [
                      (0, h.jsx)(`label`, {
                        className: `text-[10px] font-extrabold text-gray-400 uppercase tracking-wider`,
                        children: `Contact Name`,
                      }),
                      (0, h.jsx)(`input`, {
                        type: `text`,
                        value: q,
                        onChange: (e) => J(e.target.value),
                        className: `w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500`,
                      }),
                    ],
                  }),
                  (0, h.jsxs)(`div`, {
                    className: `flex flex-col gap-1.5`,
                    children: [
                      (0, h.jsx)(`label`, {
                        className: `text-[10px] font-extrabold text-gray-400 uppercase tracking-wider`,
                        children: `Contact Phone`,
                      }),
                      (0, h.jsx)(`input`, {
                        type: `text`,
                        value: G,
                        onChange: (e) => K(e.target.value),
                        className: `w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500`,
                      }),
                    ],
                  }),
                  Y &&
                    (0, h.jsxs)(`div`, {
                      className: `text-[11px] font-bold text-red-500 flex items-center gap-1`,
                      children: [
                        (0, h.jsx)(te, { className: `w-3.5 h-3.5` }),
                        ` `,
                        Y,
                      ],
                    }),
                  (0, h.jsxs)(`div`, {
                    className: `flex gap-3 mt-2`,
                    children: [
                      (0, h.jsx)(`button`, {
                        type: `button`,
                        onClick: () => I(null),
                        className: `flex-1 py-3 bg-gray-100 text-gray-700 text-[13px] font-black rounded-xl hover:bg-gray-200 transition-colors`,
                        children: `Cancel`,
                      }),
                      (0, h.jsx)(`button`, {
                        type: `submit`,
                        className: `flex-1 py-3 bg-[#318616] text-white text-[13px] font-black rounded-xl hover:bg-green-700 transition-colors`,
                        children: `Save`,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      v && (0, h.jsx)(d, { onClose: le, hideUseCurrentLocation: !0 }),
      (0, h.jsx)(a, {}),
    ],
  });
}
export { g as default };
