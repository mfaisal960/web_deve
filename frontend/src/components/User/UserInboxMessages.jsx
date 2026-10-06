import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AiOutlineArrowRight,
  AiOutlineSend,
  AiOutlineStar,
  AiFillStar,
} from "react-icons/ai";
import { TfiGallery } from "react-icons/tfi";
import Ratings from "../Product/Ratings";
import { format } from "timeago.js";
import { toast } from "react-toastify";
import { server, resolveImageUrl } from "../../server";
import socket from "../../utils/socket";

// error.response is absent whenever the request never reached the server (server
// down, CORS, offline), so the message has to be read defensively.
const toastConversationError = (error) => {
  toast.error(
    error?.response?.data?.message ||
      "Could not reach the chat server. Please try again."
  );
};

// The buyer-side counterpart of the seller dashboard inbox. Both talk to the
// same conversation/message endpoints and the same socket events; they differ
// only in whose id is treated as "me" and which endpoint lists the threads.
const UserInboxMessages = () => {
  const { user } = useSelector((state) => state.user);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // /inbox?<conversationId> is where "Send Message" on a product lands, so that
  // specific thread has to open already loaded rather than after a click.
  const requestedConversationId = searchParams.get(
    "conversationId"
  ) ?? searchParams.get("conversation");

  const [conversations, setConversations] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [shopData, setShopData] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeStatus, setActiveStatus] = useState(false);
  const [open, setOpen] = useState(Boolean(requestedConversationId));
  const [loading, setLoading] = useState(true);
  // Ratings left in this thread by either side. `myReview` is derived rather
  // than stored so it cannot drift out of sync with the list.
  const [reviews, setReviews] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const showSkeleton = loading && conversations.length === 0;

  const scrollRef = useRef(null);
  const myId = user?._id;
  // Scoped to the open thread: switching threads refetches, so a rating from the
  // previous thread must not be shown against the next buyer.
  const myReview = reviews.find(
    (review) =>
      String(review.user) === String(myId) &&
      String(review.conversationId) === String(currentChat?._id)
  );

  /* ================= SOCKET ================= */

  // Opening the socket only while the inbox is mounted keeps it off the rest of
  // the app, which had no use for it but paid for every reconnect.
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const onMessage = (data) => {
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        images: data.images,
        conversationId: data.conversationId,
        createdAt: Date.now(),
      });
    };

    socket.on("getMessage", onMessage);

    return () => {
      socket.off("getMessage", onMessage);
    };
  }, []);

  useEffect(() => {
    if (!myId) return;

    socket.emit("addUser", myId);

    const onUsers = (data) => {
      setOnlineUsers(Array.isArray(data) ? data : []);
    };

    socket.on("getUsers", onUsers);

    return () => {
      socket.off("getUsers", onUsers);
    };
  }, [myId]);

  useEffect(() => {
    if (
      !arrivalMessage ||
      !currentChat?._id ||
      // A message can arrive for a thread that is not open; the server has no
      // notion of "which thread is this tab showing".
      arrivalMessage.conversationId !== currentChat._id ||
      !currentChat.members.includes(arrivalMessage.sender)
    ) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: arrivalMessage.sender,
        text: arrivalMessage.text,
        images: arrivalMessage.images,
        createdAt: arrivalMessage.createdAt,
      },
    ]);
  }, [arrivalMessage, currentChat]);

  /* ================= GET CONVERSATIONS ================= */

  useEffect(() => {
    let cancelled = false;

    const getConversation = async () => {
      if (!myId) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${server}/conversation/get-all-conversation-user/${myId}`,
          { withCredentials: true }
        );

        if (cancelled) return;

        setConversations(response.data.conversations || []);
      } catch (error) {
        console.log(error);

        if (!cancelled) {
          toastConversationError(error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    getConversation();

    return () => {
      cancelled = true;
    };
  }, [myId, messages]);

  /* ================= DEEP LINK ================= */

  useEffect(() => {
    if (!requestedConversationId || !myId) return;

    // The requested thread has to be one the buyer is actually a member of,
    // otherwise the query string alone would expose someone else's messages.
    const match = conversations.find(
      (item) => item._id === requestedConversationId
    );

    if (match && match._id !== currentChat?._id) {
      setCurrentChat(match);
      setOpen(true);
      setReviews([]);
      setReviewOpen(false);
    }
  }, [requestedConversationId, conversations, myId, currentChat]);

  /* ================= SHOP DETAILS ================= */

  useEffect(() => {
    if (!currentChat?._id || !myId) return;

    const shopId = currentChat.members.find((member) => member !== myId);

    if (!shopId) return;

    let cancelled = false;

    const getShop = async () => {
      try {
        const response = await axios.get(`${server}/shop/get-shop-info/${shopId}`);

        if (!cancelled) setShopData(response.data.shop);
      } catch (error) {
        console.log(error);
      }
    };

    getShop();

    return () => {
      cancelled = true;
    };
  }, [currentChat, myId]);

  /* ================= ONLINE CHECK ================= */

  const onlineCheck = (chat) => {
    if (!myId) return false;

    const shopMember = chat.members.find((member) => member !== myId);

    if (!shopMember) return false;

    return onlineUsers.some((entry) => entry.userId === shopMember);
  };

  /* ================= GET MESSAGES ================= */

  useEffect(() => {
    let cancelled = false;

    const getMessage = async () => {
      if (!currentChat?._id) return;

      try {
        const response = await axios.get(
          `${server}/message/get-all-messages/${currentChat._id}`
        );

        if (!cancelled) setMessages(response.data.messages || []);
      } catch (error) {
        console.log(error);
      }
    };

    getMessage();

    return () => {
      cancelled = true;
    };
  }, [currentChat]);

  /* ================= SEND MESSAGE ================= */

  const sendMessageHandler = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentChat?._id || !myId) {
      return;
    }

    const receiverId = currentChat.members.find((member) => member !== myId);

    if (!receiverId) return;

    socket.emit("sendMessage", {
      senderId: myId,
      receiverId,
      text: newMessage,
    });

    try {
      const response = await axios.post(
        `${server}/message/create-new-message`,
        {
          sender: myId,
          text: newMessage,
          conversationId: currentChat._id,
        },
        { withCredentials: true }
      );

      setMessages((prev) => [...prev, response.data.message]);

      await updateLastMessage(newMessage);
    } catch (error) {
      console.log(error);
      toastConversationError(error);
    }
  };

  /* ================= IMAGE SEND ================= */

  const imageSendingHandler = async (image) => {
    if (!currentChat?._id || !myId) return;

    const receiverId = currentChat.members.find((member) => member !== myId);

    if (!receiverId) return;

    socket.emit("sendMessage", {
      senderId: myId,
      receiverId,
      images: image,
    });

    try {
      const response = await axios.post(
        `${server}/message/create-new-message`,
        {
          sender: myId,
          text: "",
          images: image,
          conversationId: currentChat._id,
        },
        { withCredentials: true }
      );

      setMessages((prev) => [...prev, response.data.message]);

      await updateLastMessage("Photo");
    } catch (error) {
      console.log(error);
      toastConversationError(error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        imageSendingHandler(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  /* ================= SHOP REVIEW ================= */

  // The rating the buyer gave this shop in this thread. Null until loaded, and
  // `myReview` is the one this buyer is allowed to change.
  useEffect(() => {
    if (!currentChat?._id) return;

    let cancelled = false;

    const getReviews = async () => {
      try {
        const response = await axios.get(
          `${server}/shop-review/conversation/${currentChat._id}/reviews`,
          { withCredentials: true }
        );

        if (!cancelled) setReviews(response.data.reviews || []);
      } catch (error) {
        console.log(error);
      }
    };

    getReviews();

    return () => {
      cancelled = true;
    };
  }, [currentChat]);

  const submitReview = async ({ rating, comment }) => {
    if (!currentChat?._id) return;

    setReviewSubmitting(true);

    try {
      const { data } = await axios.post(
        `${server}/shop-review/conversation/${currentChat._id}/review`,
        { rating, comment },
        { withCredentials: true }
      );

      // Replace this buyer's own entry rather than appending, so re-rating the
      // shop does not leave two ratings from the same person on screen.
      setReviews((prev) => [
        data.review,
        ...prev.filter((review) => String(review.user) !== String(myId)),
      ]);

      toast.success("Thanks! Your rating was sent to the shop.");
      setReviewOpen(false);
    } catch (error) {
      console.log(error);
      toastConversationError(error);
    } finally {
      setReviewSubmitting(false);
    }
  };

  /* ================= UPDATE LAST MESSAGE ================= */

  const updateLastMessage = async (text) => {
    socket.emit("updateLastMessage", {
      lastMessage: text,
      lastMessageId: myId,
    });

    try {
      await axios.put(
        `${server}/conversation/update-last-message/${currentChat._id}`,
        { lastMessage: text, lastMessageId: myId },
        { withCredentials: true }
      );

      setNewMessage("");
    } catch (error) {
      console.log(error);
    }
  };

  /* ================= OPEN / CLOSE THREAD ================= */

  const openConversation = (chat) => {
    setCurrentChat(chat);
    setOpen(true);
    // Ratings belong to one thread, so the previous thread's list must not stay
    // on screen while the new one loads.
    setReviews([]);
    setReviewOpen(false);
    setActiveStatus(onlineCheck(chat));
    navigate(`/inbox?conversationId=${chat._id}`, { replace: true });
  };

  const closeConversation = () => {
    setOpen(false);
    setCurrentChat(null);
    setMessages([]);
    navigate("/inbox", { replace: true });
  };

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* ================= RENDER ================= */

  if (!user) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="text-sm text-gray-500">
          Please log in to view your messages.
        </p>
      </div>
    );
  }

  return (
    <div className="m-4 h-[85vh] w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:m-5 lg:w-[90%]">
      {!open && (
        <>
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              My Messages
            </h1>

            <p className="mt-1 text-center text-sm text-gray-500">
              Conversations with the shops you have ordered from
            </p>
          </div>

          <div className="h-[calc(85vh-100px)] overflow-y-auto">
            {showSkeleton ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-gray-500">Loading conversations...</p>
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((item, index) => (
                <MessageList
                  data={item}
                  key={item._id || index}
                  me={myId}
                  online={onlineCheck(item)}
                  onOpen={openConversation}
                />
              ))
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-2xl">💬</span>
                </div>

                <h2 className="text-lg font-semibold text-gray-900">
                  No Conversations
                </h2>

                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Message a shop from any product page to start a conversation.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {open && currentChat && (
        <ConversationPanel
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessageHandler={sendMessageHandler}
          handleImageUpload={handleImageUpload}
          myId={myId}
          shopData={shopData}
          activeStatus={activeStatus}
          scrollRef={scrollRef}
          onBack={closeConversation}
          myReview={myReview}
          reviewOpen={reviewOpen}
          setReviewOpen={setReviewOpen}
          onSubmitReview={submitReview}
          reviewSubmitting={reviewSubmitting}
        />
      )}
    </div>
  );
};

/* =========================================================
   MESSAGE LIST
========================================================= */

const MessageList = ({ data, me, online, onOpen }) => {
  const [shop, setShop] = useState(null);

  const shopId = data.members?.find((member) => member !== me);

  useEffect(() => {
    if (!shopId) return;

    let cancelled = false;

    const getShop = async () => {
      try {
        const response = await axios.get(`${server}/shop/get-shop-info/${shopId}`);

        if (!cancelled) setShop(response.data.shop);
      } catch (error) {
        console.log(error);
      }
    };

    getShop();

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  const lastMessageFromMe = data?.lastMessageId === me;

  return (
    <div
      className="group flex w-full cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-4 transition-all duration-200 hover:bg-gray-50 sm:px-5"
      onClick={() => onOpen(data)}
    >
      <div className="relative flex-shrink-0">
        <img
          src={resolveImageUrl(shop?.avatar?.url || shop?.avatar)}
          alt={shop?.name || "Shop"}
          className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm sm:h-14 sm:w-14"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src =
              "https://dummyimage.com/128x128/e5e7eb/6b7280?text=Shop";
          }}
        />

        <span
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
            online ? "bg-green-500" : "bg-gray-300"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
            {shop?.name || "Loading..."}
          </h1>

          <span
            className={`hidden text-xs sm:block ${
              online ? "text-green-600" : "text-gray-400"
            }`}
          >
            {online ? "Online" : "Offline"}
          </span>
        </div>

        <p className="mt-1 truncate text-sm text-gray-500">
          {lastMessageFromMe ? "You: " : ""}
          <span className="text-gray-600">{data?.lastMessage}</span>
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   SHOP REVIEW
========================================================= */

// The rating the buyer gave the shop, shown to both sides of the thread. Written
// from inside the chat rather than on the order page, because this is a rating
// of the shop and the conversation is where the buyer already is.
const ShopReviewPanel = ({
  myReview,
  reviewOpen,
  setReviewOpen,
  onSubmit,
  submitting,
  canRate,
}) => {
  if (!reviewOpen) {
    return (
      <div className="border-b border-gray-100 bg-white px-4 py-3 sm:px-5">
        {myReview ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-gray-500">
                Your rating
              </span>
              <Ratings rating={myReview.rating} />
            </div>

            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-xs text-gray-500">
              Rate this shop to help other buyers
            </p>

            {canRate && (
              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
              >
                Leave a rating
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-4 sm:px-5">
      <ReviewForm
        initialRating={myReview?.rating || 0}
        initialComment={myReview?.comment || ""}
        submitting={submitting}
        onSubmit={onSubmit}
        onCancel={() => setReviewOpen(false)}
      />
    </div>
  );
};

const ReviewForm = ({
  initialRating,
  initialComment,
  submitting,
  onSubmit,
  onCancel,
}) => {
  // Seeded from props only on mount: the form is unmounted whenever the panel is
  // collapsed, so reopening it re-seeds with the saved rating and comment.
  const [rating, setRating] = useState(initialRating || 0);
  const [comment, setComment] = useState(initialComment || "");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (rating === 0) {
      toast.error("Please pick a star rating.");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write a comment.");
      return;
    }

    onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Rate this shop out of 5"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= rating;

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              disabled={submitting}
              onClick={() => setRating(star)}
              className={`text-2xl leading-none transition-transform ${
                submitting
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:scale-110"
              }`}
            >
              {filled ? (
                <AiFillStar className="text-yellow-400" aria-hidden="true" />
              ) : (
                <AiOutlineStar className="text-gray-300" aria-hidden="true" />
              )}
            </button>
          );
        })}

        <span className="ml-2 text-xs text-gray-500">
          {rating > 0 ? `${rating} out of 5` : "Tap to rate"}
        </span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={600}
        placeholder="Tell others what you think of this shop..."
        className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Submit rating"}
        </button>
      </div>
    </form>
  );
};

/* =========================================================
   CONVERSATION PANEL
========================================================= */

const ConversationPanel = ({
  messages,
  newMessage,
  setNewMessage,
  sendMessageHandler,
  handleImageUpload,
  myId,
  shopData,
  activeStatus,
  scrollRef,
  onBack,
  myReview,
  reviewOpen,
  setReviewOpen,
  onSubmitReview,
  reviewSubmitting,
}) => {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={resolveImageUrl(shopData?.avatar?.url || shopData?.avatar)}
              alt={shopData?.name || "Shop"}
              className="h-11 w-11 rounded-full object-cover sm:h-12 sm:w-12"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src =
                  "https://dummyimage.com/96x96/e5e7eb/6b7280?text=Shop";
              }}
            />

            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                activeStatus ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-gray-900">
              {shopData?.name || "Shop"}
            </h1>

            <p
              className={`text-xs font-medium ${
                activeStatus ? "text-green-600" : "text-gray-400"
              }`}
            >
              {activeStatus ? "Active Now" : "Offline"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <AiOutlineArrowRight size={20} />
        </button>
      </div>

      {/* Rating for this shop, shared by both sides of the thread */}
      <ShopReviewPanel
        myReview={myReview}
        reviewOpen={reviewOpen}
        setReviewOpen={setReviewOpen}
        onSubmit={onSubmitReview}
        submitting={reviewSubmitting}
        canRate={Boolean(myId)}
      />

      <div className="h-[65vh] flex-1 overflow-y-auto bg-gray-50/70 px-3 py-4 sm:px-5">
        {messages.length > 0 ? (
          messages.map((item, index) => {
            const isMine = item.sender === myId;

            return (
              <div
                key={item._id || index}
                className={`mb-4 flex w-full items-end gap-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
                ref={index === messages.length - 1 ? scrollRef : null}
              >
                {!isMine && (
                  <img
                    src={resolveImageUrl(shopData?.avatar?.url || shopData?.avatar)}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover sm:h-9 sm:w-9"
                    alt={shopData?.name || "Shop"}
                  />
                )}

                <div
                  className={`flex max-w-[80%] flex-col ${
                    isMine ? "items-end" : "items-start"
                  } sm:max-w-[65%]`}
                >
                  {item.images?.url && (
                    <img
                      src={item.images.url}
                      alt="Message attachment"
                      className="mb-1 max-h-[300px] max-w-[280px] rounded-xl border border-gray-100 object-cover shadow-sm sm:max-w-[320px]"
                    />
                  )}

                  {item.text && (
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${
                        isMine
                          ? "rounded-br-md bg-gray-900 text-white"
                          : "rounded-bl-md bg-white text-gray-800"
                      }`}
                    >
                      <p className="break-words">{item.text}</p>
                    </div>
                  )}

                  <p
                    className={`mt-1 px-1 text-[11px] text-gray-400 ${
                      isMine ? "text-right" : "text-left"
                    }`}
                  >
                    {format(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <span className="text-xl">💬</span>
              </div>

              <p className="text-sm font-medium text-gray-700">
                No messages yet
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Start the conversation below.
              </p>
            </div>
          </div>
        )}
      </div>

      <form
        className="border-t border-gray-100 bg-white p-3 sm:p-4"
        onSubmit={sendMessageHandler}
      >
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <input
              type="file"
              id="user-inbox-image"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <label
              htmlFor="user-inbox-image"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <TfiGallery size={19} />
            </label>
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="Enter your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />

            <button
              type="submit"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-blue-600 text-white transition-all hover:bg-blue-700 active:scale-95"
              aria-label="Send message"
            >
              <AiOutlineSend size={17} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserInboxMessages;