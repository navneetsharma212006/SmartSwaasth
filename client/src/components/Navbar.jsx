import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  FiHome, 
  FiShield, 
  FiUpload, 
  FiGrid, 
  FiInfo, 
  FiMail,
  FiChevronDown,
  FiHelpCircle,
  FiShieldOff,
  FiActivity,
  FiBookOpen,
  FiMenu,
  FiX,
  FiBell,
  FiLogOut,
  FiLogIn,
  FiUsers
} from "react-icons/fi";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/api.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = API_BASE_URL.replace("/api", "");

export default function Navbar() {
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const { user, logout } = useAuth();
  const [showResourcesMenu, setShowResourcesMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showMobileNotifSheet, setShowMobileNotifSheet] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [chatToast, setChatToast] = useState(null); // { from, content, url }

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMobileMenuOpen) {
      setShowResourcesMenu(false);
      setShowMobileNotifSheet(false);
    }
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setShowResourcesMenu(false);
    setShowMobileNotifSheet(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen || showMobileNotifSheet) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen, showMobileNotifSheet]);

  const loadNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const data = await fetchNotifications(40);
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* keep prior state */
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("[socket] Connected to notification socket");
      // Join personal room so server can target this user directly
      if (user?._id) {
        socket.emit("join_user_room", { userId: user._id });
      }
    });

    // Medicine / expiry notifications
    socket.on("notification:new", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
      if (Notification.permission === "granted") {
        new Notification(notif.title, {
          body: notif.message,
          icon: "/pwa-192x192.png",
        });
      }
    });

    // Chat message notifications — show Instagram-style banner
    socket.on("notification:chat", ({ from, content }) => {
      // Increment the unread badge so chat icon updates
      setUnreadCount((c) => c + 1);
      // Show an in-app toast banner
      setChatToast({ from, content, url: `/chat/${from}` });
      // Auto-dismiss after 6 seconds
      setTimeout(() => setChatToast(null), 6000);
      // Also fire a browser push if app is in background
      if (Notification.permission === "granted") {
        new Notification("💬 New Message", {
          body: content.length > 80 ? content.slice(0, 77) + "…" : content,
          icon: "/pwa-192x192.png",
          tag: `chat-${from}`,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [loadNotifications, user?._id]);

  useEffect(() => {
    if (!showNotifPanel) return;
    const onDocClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showNotifPanel]);

  const handleOpenNotif = () => {
    setShowNotifPanel((v) => !v);
    setShowResourcesMenu(false);
    loadNotifications();
  };

  const handleClickNotification = async (n) => {
    if (!n.read) {
      try {
        const updated = await markNotificationRead(n._id);
        setNotifications((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, ...updated, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }
    setShowNotifPanel(false);
    setShowMobileNotifSheet(false);
    navigate("/dashboard");
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  const linkBase = "px-3 py-2 text-sm rounded-md transition-colors";
  const mobileLinkBase = "block px-4 py-3 text-base transition-colors border-b border-black/5";

  return (
    <>
      {/* Instagram-style chat toast */}
      {chatToast && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl cursor-pointer animate-in slide-in-from-top-4 duration-300 max-w-sm w-[calc(100%-2rem)]"
          onClick={() => { navigate(chatToast.url); setChatToast(null); }}
        >
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-sm font-bold">
            💬
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-400">New Message</p>
            <p className="text-sm truncate opacity-90">{chatToast.content}</p>
          </div>
          <button
            className="text-white/50 hover:text-white ml-1 shrink-0"
            onClick={(e) => { e.stopPropagation(); setChatToast(null); }}
          >✕</button>
        </div>
      )}

      <header className="border-b border-black/10 bg-white sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <FiShield className="text-2xl" />
          <span>SmartSwaasth</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `${linkBase} ${isActive ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`
            }
          >
            <FiHome className="inline mr-1" /> Home
          </NavLink>
          
          {user && (
            <>
              {user.role === "caregiver" && (
                <NavLink 
                  to="/scan" 
                  className={({ isActive }) => 
                    `${linkBase} ${isActive ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`
                  }
                >
                  <FiUpload className="inline mr-1" /> Scan
                </NavLink>
              )}
              
              {user.role === "patient" && (
                <NavLink 
                  to="/patients" 
                  className={({ isActive }) => 
                    `${linkBase} ${isActive ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`
                  }
                >
                  <FiUsers className="inline mr-1" /> Connect
                </NavLink>
              )}
              {user.role === "caregiver" && (
                <NavLink 
                  to="/patients" 
                  className={({ isActive }) => 
                    `${linkBase} ${isActive ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`
                  }
                >
                  <FiUsers className="inline mr-1" /> Patients
                </NavLink>
              )}

            </>
          )}

          {user && (
            <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={handleOpenNotif}
              className={`${linkBase} inline-flex items-center gap-1.5 text-black/70 hover:bg-black/5 hover:text-black relative`}
              aria-expanded={showNotifPanel}
              aria-haspopup="true"
            >
              <FiBell className="inline" />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-[1.125rem] text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <div className="absolute right-0 top-full z-[60] mt-1 w-[min(100vw-2rem,22rem)] max-h-[min(70vh,24rem)] overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl flex flex-col">
                <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
                  <span className="text-sm font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-black/60 hover:text-black"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifLoading && notifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-black/50">Loading…</p>
                  ) : notifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-black/50">
                      No reminders yet. Daily dose and expiry alerts appear here.
                    </p>
                  ) : (
                    <ul className="divide-y divide-black/10">
                      {notifications.map((n) => (
                        <li key={n._id}>
                          <button
                            type="button"
                            onClick={() => handleClickNotification(n)}
                            className={`w-full px-3 py-2.5 text-left text-sm transition hover:bg-black/[0.04] ${
                              n.read ? "text-black/70" : "bg-emerald-50/50 font-medium text-black"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                                  n.type === "expiry"
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-blue-100 text-blue-900"
                                }`}
                              >
                                {n.type === "expiry" ? "Expiry" : "Dose"}
                              </span>
                              <span className="flex-1">
                                <span className="block">{n.title}</span>
                                <span className="mt-0.5 block text-xs font-normal text-black/55 line-clamp-2">
                                  {n.message}
                                </span>
                                <span className="mt-1 block text-[10px] text-black/40">
                                  {n.createdAt
                                    ? new Date(n.createdAt).toLocaleString()
                                    : ""}
                                </span>
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            </div>
          )}
          
          {user ? (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className={`${linkBase} text-red-600 hover:bg-red-50`}
            >
              <FiLogOut className="inline mr-1" /> Logout
            </button>
          ) : (
            <>
              <Link to="/login" className={linkBase}>
                <FiLogIn className="inline mr-1" /> Login
              </Link>
              <Link to="/register" className={`${linkBase} bg-black text-white hover:bg-black/90`}>
                Register
              </Link>
            </>
          )}

          {/* Resources Dropdown - Desktop */}
          <div className="relative">
            <button 
              onClick={() => setShowResourcesMenu(!showResourcesMenu)}
              className="px-3 py-2 text-sm rounded-md inline-flex items-center gap-1 text-black/70 hover:bg-black/5 hover:text-black transition-colors"
            >
              <FiBookOpen className="inline" /> Resources 
              <FiChevronDown className={`text-xs transition-transform duration-200 ${showResourcesMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showResourcesMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 rounded-md border border-black/10 bg-white shadow-lg z-50">
                <Link 
                  to="/about" 
                  className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors" 
                  onClick={() => setShowResourcesMenu(false)}
                >
                  <FiInfo className="inline mr-2" /> About Us
                </Link>
                <Link 
                  to="/how-it-works" 
                  className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors" 
                  onClick={() => setShowResourcesMenu(false)}
                >
                  <FiActivity className="inline mr-2" /> How It Works
                </Link>
                <Link 
                  to="/safety-guide" 
                  className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors" 
                  onClick={() => setShowResourcesMenu(false)}
                >
                  <FiShieldOff className="inline mr-2" /> Medication Safety
                </Link>
                <Link 
                  to="/faq" 
                  className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors" 
                  onClick={() => setShowResourcesMenu(false)}
                >
                  <FiHelpCircle className="inline mr-2" /> FAQ
                </Link>
                <Link 
                  to="/contact" 
                  className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors" 
                  onClick={() => setShowResourcesMenu(false)}
                >
                  <FiMail className="inline mr-2" /> Contact
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Hamburger Menu Button - Mobile */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-md hover:bg-black/5 transition-colors z-50 relative text-black/70 hover:text-black"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 transition-all duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} 
        onClick={closeMobileMenu}
        style={{ zIndex: 45 }}
      />

      {/* Mobile Menu Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-[80vw] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden z-50`}
        style={{ 
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-black/10">
            <div className="flex items-center gap-2">
              <FiShield className="text-2xl" />
              <span className="font-semibold text-lg">SmartSwaasth</span>
            </div>
            <button 
              onClick={closeMobileMenu} 
              className="p-2 rounded-md hover:bg-black/5 text-black/70 hover:text-black transition-colors"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex-1 overflow-y-auto">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `${mobileLinkBase} flex items-center gap-3 ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'text-black/70 hover:bg-black/5 hover:text-black'
                }`
              }
              onClick={closeMobileMenu}
            >
              <FiHome className="text-lg" /> Home
            </NavLink>
            
            {user?.role === "caregiver" && (
              <NavLink 
                to="/scan" 
                className={({ isActive }) => 
                  `${mobileLinkBase} flex items-center gap-3 ${
                    isActive 
                      ? 'bg-black text-white' 
                      : 'text-black/70 hover:bg-black/5 hover:text-black'
                  }`
                }
                onClick={closeMobileMenu}
              >
                <FiUpload className="text-lg" /> Scan Medicine
              </NavLink>
            )}
            
            {user?.role === "patient" && (
              <NavLink 
                to="/patients" 
                className={({ isActive }) => 
                  `${mobileLinkBase} flex items-center gap-3 ${
                    isActive 
                      ? 'bg-black text-white' 
                      : 'text-black/70 hover:bg-black/5 hover:text-black'
                  }`
                }
                onClick={closeMobileMenu}
              >
                <FiUsers className="text-lg" /> Connect
              </NavLink>
            )}
            
            {user?.role === "caregiver" && (
              <NavLink 
                to="/patients" 
                className={({ isActive }) => 
                  `${mobileLinkBase} flex items-center gap-3 ${
                    isActive 
                      ? 'bg-black text-white' 
                      : 'text-black/70 hover:bg-black/5 hover:text-black'
                  }`
                }
                onClick={closeMobileMenu}
              >
                <FiUsers className="text-lg" /> Patients
              </NavLink>
            )}

            {user ? (
              <button
                onClick={() => {
                  logout();
                  closeMobileMenu();
                  navigate("/");
                }}
                className={`${mobileLinkBase} flex items-center gap-3 w-full text-left text-red-600 hover:bg-red-50`}
              >
                <FiLogOut className="text-lg" /> Logout
              </button>
            ) : (
              <>
                <Link to="/login" className={`${mobileLinkBase} flex items-center gap-3`} onClick={closeMobileMenu}>
                  <FiLogIn className="text-lg" /> Login
                </Link>
                <Link to="/register" className={`${mobileLinkBase} bg-black text-white hover:bg-black/90 mx-4 rounded-md mt-2 mb-2 text-center py-2`} onClick={closeMobileMenu}>
                  Register
                </Link>
              </>
            )}

            <NavLink
              to="/notifications"
              className={({ isActive }) => 
                `${mobileLinkBase} flex items-center justify-between gap-3 ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'text-black/70 hover:bg-black/5 hover:text-black'
                }`
              }
              onClick={closeMobileMenu}
            >
              <span className="flex items-center gap-3">
                <FiBell className="text-lg" /> Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>

            {/* Mobile Resources Section */}
            <div>
              <button 
                onClick={() => setShowResourcesMenu(!showResourcesMenu)}
                className="w-full px-4 py-3 text-base flex items-center justify-between text-black/70 hover:bg-black/5 hover:text-black transition-colors border-b border-black/5"
              >
                <span className="flex items-center gap-3">
                  <FiBookOpen className="text-lg" /> Resources
                </span>
                <FiChevronDown className={`text-sm transition-transform duration-200 ${showResourcesMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showResourcesMenu && (
                <div className="bg-gray-50">
                  <Link 
                    to="/about" 
                    className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors pl-11 border-b border-black/5" 
                    onClick={closeMobileMenu}
                  >
                    <FiInfo className="inline mr-2" /> About Us
                  </Link>
                  <Link 
                    to="/how-it-works" 
                    className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors pl-11 border-b border-black/5" 
                    onClick={closeMobileMenu}
                  >
                    <FiActivity className="inline mr-2" /> How It Works
                  </Link>
                  <Link 
                    to="/safety-guide" 
                    className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors pl-11 border-b border-black/5" 
                    onClick={closeMobileMenu}
                  >
                    <FiShieldOff className="inline mr-2" /> Medication Safety
                  </Link>
                  <Link 
                    to="/faq" 
                    className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors pl-11 border-b border-black/5" 
                    onClick={closeMobileMenu}
                  >
                    <FiHelpCircle className="inline mr-2" /> FAQ
                  </Link>
                  <Link 
                    to="/contact" 
                    className="block px-4 py-2 text-sm text-black/70 hover:bg-black/5 hover:text-black transition-colors pl-11" 
                    onClick={closeMobileMenu}
                  >
                    <FiMail className="inline mr-2" /> Contact
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="border-t border-black/10 p-4">
            <p className="text-xs text-center text-black/60">
              © 2024 SmartSwaasth
            </p>
          </div>
        </div>
      </div>

      {showMobileNotifSheet && (
        <div className="fixed inset-0 z-[60] md:hidden flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <span className="font-semibold">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-black/60"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowMobileNotifSheet(false)}
                className="rounded-md p-2 hover:bg-black/5"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-black/50">
                No reminders yet.
              </p>
            ) : (
              <ul className="divide-y divide-black/10">
                {notifications.map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => handleClickNotification(n)}
                      className={`w-full px-4 py-3 text-left text-sm ${
                        n.read ? "text-black/70" : "bg-emerald-50/40 font-medium"
                      }`}
                    >
                      <span
                        className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] uppercase ${
                          n.type === "expiry"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-blue-100 text-blue-900"
                        }`}
                      >
                        {n.type === "expiry" ? "Expiry" : "Dose"}
                      </span>
                      {n.title}
                      <span className="mt-1 block text-xs font-normal text-black/55">
                        {n.message}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
}