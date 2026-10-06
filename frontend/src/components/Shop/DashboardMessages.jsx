import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { server } from "../../server";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AiOutlineArrowRight, AiOutlineSend } from "react-icons/ai";
import { TfiGallery } from "react-icons/tfi";
import socket from "../../utils/socket";
import { format } from "timeago.js";

const DashboardMessages = () => {
  const { seller, isLoading } = useSelector((state) => state.seller);

  const [conversations, setConversations] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [currentChat, setCurrentChat] = useState();
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeStatus, setActiveStatus] = useState(false);
  const [images, setImages] = useState();
  const [open, setOpen] = useState(false);

  const scrollRef = useRef(null);

  /* ================= SOCKET MESSAGE ================= */

  useEffect(() => {
    socket.on("getMessage", (data) => {
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        createdAt: Date.now(),
      });
    });

    return () => {
      socket.off("getMessage");
    };
  }, []);

  useEffect(() => {
    if (
      arrivalMessage &&
      currentChat?.members.includes(arrivalMessage.sender)
    ) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, currentChat]);

  /* ================= GET CONVERSATIONS ================= */

  useEffect(() => {
    const getConversation = async () => {
      if (!seller?._id) return;

      try {
        const response = await axios.get(
          `${server}/conversation/get-all-conversation-seller/${seller._id}`,
          {
            withCredentials: true,
          }
        );

        setConversations(response.data.conversations);
      } catch (error) {
        console.log(error);
      }
    };

    getConversation();
  }, [seller, messages]);

  /* ================= SOCKET USERS ================= */

  // Opening the socket only while the inbox is mounted keeps it off the other
  // pages of the app, which had no use for it but paid for every reconnect.
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (seller) {
      const sellerId = seller?._id;

      socket.emit("addUser", sellerId);

      socket.on("getUsers", (data) => {
        setOnlineUsers(data);
      });
    }

    return () => {
      socket.off("getUsers");
    };
  }, [seller]);

  /* ================= ONLINE CHECK ================= */

  const onlineCheck = (chat) => {
    const chatMembers = chat.members.find(
      (member) => member !== seller?._id
    );

    const online = onlineUsers.find(
      (user) => user.userId === chatMembers
    );

    return online ? true : false;
  };

  /* ================= GET MESSAGES ================= */

  useEffect(() => {
    const getMessage = async () => {
      if (!currentChat?._id) return;

      try {
        const response = await axios.get(
          `${server}/message/get-all-messages/${currentChat._id}`
        );

        setMessages(response.data.messages);
      } catch (error) {
        console.log(error);
      }
    };

    getMessage();
  }, [currentChat]);

  /* ================= SEND MESSAGE ================= */

  const sendMessageHandler = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentChat?._id || !seller?._id) {
      return;
    }

    const message = {
      sender: seller._id,
      text: newMessage,
      conversationId: currentChat._id,
    };

    const receiverId = currentChat.members.find(
      (member) => member !== seller._id
    );

    socket.emit("sendMessage", {
      senderId: seller._id,
      receiverId,
      text: newMessage,
    });

    try {
      await axios
        .post(`${server}/message/create-new-message`, message)
        .then((res) => {
          setMessages((prev) => [...prev, res.data.message]);
          updateLastMessage();
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  /* ================= UPDATE LAST MESSAGE ================= */

  const updateLastMessage = async () => {
    socket.emit("updateLastMessage", {
      lastMessage: newMessage,
      lastMessageId: seller._id,
    });

    await axios
      .put(`${server}/conversation/update-last-message/${currentChat._id}`, {
        lastMessage: newMessage,
        lastMessageId: seller._id,
      })
      .then((res) => {
        console.log(res.data.conversation);
        setNewMessage("");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  /* ================= IMAGE UPLOAD ================= */

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setImages(reader.result);
        imageSendingHandler(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  /* ================= SEND IMAGE ================= */

  const imageSendingHandler = async (image) => {
    if (!currentChat?._id || !seller?._id) return;

    const receiverId = currentChat.members.find(
      (member) => member !== seller._id
    );

    socket.emit("sendMessage", {
      senderId: seller._id,
      receiverId,
      images: image,
    });

    try {
      await axios
        .post(`${server}/message/create-new-message`, {
          images: image,
          sender: seller._id,
          text: newMessage,
          conversationId: currentChat._id,
        })
        .then((res) => {
          setImages();
          setMessages((prev) => [...prev, res.data.message]);
          updateLastMessageForImage();
        });
    } catch (error) {
      console.log(error);
    }
  };

  /* ================= UPDATE LAST IMAGE MESSAGE ================= */

  const updateLastMessageForImage = async () => {
    await axios.put(
      `${server}/conversation/update-last-message/${currentChat._id}`,
      {
        lastMessage: "Photo",
        lastMessageId: seller._id,
      }
    );
  };

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="m-4 h-[85vh] w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:m-5 lg:w-[90%]">
      {!open && (
        <>
          {/* Header */}
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              All Messages
            </h1>

            <p className="mt-1 text-center text-sm text-gray-500">
              Manage your customer conversations
            </p>
          </div>

          {/* Conversation List */}
          <div className="h-[calc(85vh-100px)] overflow-y-auto">
            {conversations && conversations.length > 0 ? (
              conversations.map((item, index) => (
                <MessageList
                  data={item}
                  key={item._id || index}
                  index={index}
                  setOpen={setOpen}
                  setCurrentChat={setCurrentChat}
                  me={seller?._id}
                  setUserData={setUserData}
                  userData={userData}
                  online={onlineCheck(item)}
                  setActiveStatus={setActiveStatus}
                  isLoading={isLoading}
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
                  Your customer conversations will appear here.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {open && (
        <SellerInbox
          setOpen={setOpen}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessageHandler={sendMessageHandler}
          messages={messages}
          sellerId={seller?._id}
          userData={userData}
          activeStatus={activeStatus}
          scrollRef={scrollRef}
          setMessages={setMessages}
          handleImageUpload={handleImageUpload}
        />
      )}
    </div>
  );
};

/* =========================================================
   MESSAGE LIST
========================================================= */

const MessageList = ({
  data,
  index,
  setOpen,
  setCurrentChat,
  me,
  setUserData,
  online,
  setActiveStatus,
  isLoading,
}) => {
  const [user, setUser] = useState([]);
  const [active, setActive] = useState(0);

  const navigate = useNavigate();

  const handleClick = (id) => {
    navigate(`/dashboard-messages?${id}`);
    setOpen(true);
  };

  useEffect(() => {
    const userId = data.members.find((user) => user !== me);

    const getUser = async () => {
      try {
        const response = await axios.get(
          `${server}/user/user-info/${userId}`
        );

        setUser(response.data.user);
      } catch (error) {
        console.log(error);
      }
    };

    if (userId) {
      getUser();
    }
  }, [me, data]);

  const handleConversationClick = () => {
    setActive(index);
    handleClick(data._id);
    setCurrentChat(data);
    setUserData(user);
    setActiveStatus(online);
  };

  return (
    <div
      className={`group flex w-full cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-4 transition-all duration-200 sm:px-5 ${
        active === index
          ? "bg-blue-50/70"
          : "bg-white hover:bg-gray-50"
      }`}
      onClick={handleConversationClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={user?.avatar?.url}
          alt={user?.name || "User"}
          className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm sm:h-14 sm:w-14"
        />

        <span
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
            online ? "bg-green-500" : "bg-gray-300"
          }`}
        />
      </div>

      {/* User Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
            {user?.name || "Loading..."}
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
          {!isLoading && data?.lastMessageId !== user?._id
            ? "You:"
            : user?.name?.split(" ")[0] + ":"}{" "}
          <span className="text-gray-600">
            {data?.lastMessage}
          </span>
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   SELLER INBOX
========================================================= */

const SellerInbox = ({
  scrollRef,
  setOpen,
  newMessage,
  setNewMessage,
  sendMessageHandler,
  messages,
  sellerId,
  userData,
  activeStatus,
  handleImageUpload,
}) => {
  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* Message Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={userData?.avatar?.url}
              alt={userData?.name || "User"}
              className="h-11 w-11 rounded-full object-cover sm:h-12 sm:w-12"
            />

            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                activeStatus ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-gray-900">
              {userData?.name || "User"}
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
          onClick={() => setOpen(false)}
          aria-label="Back to conversations"
        >
          <AiOutlineArrowRight size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="h-[65vh] flex-1 overflow-y-auto bg-gray-50/70 px-3 py-4 sm:px-5">
        {messages && messages.length > 0 ? (
          messages.map((item, index) => {
            const isMine = item.sender === sellerId;

            return (
              <div
                key={item._id || index}
                className={`mb-4 flex w-full items-end gap-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
                ref={
                  index === messages.length - 1
                    ? scrollRef
                    : null
                }
              >
                {!isMine && (
                  <img
                    src={userData?.avatar?.url}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover sm:h-9 sm:w-9"
                    alt={userData?.name || "User"}
                  />
                )}

                <div
                  className={`flex max-w-[80%] flex-col ${
                    isMine ? "items-end" : "items-start"
                  } sm:max-w-[65%]`}
                >
                  {/* Image Message */}
                  {item.images && (
                    <img
                      src={`${item.images?.url}`}
                      alt="Message attachment"
                      className="mb-1 max-h-[300px] max-w-[280px] rounded-xl border border-gray-100 object-cover shadow-sm sm:max-w-[320px]"
                    />
                  )}

                  {/* Text Message */}
                  {item.text !== "" && (
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${
                        isMine
                          ? "rounded-br-md bg-gray-900 text-white"
                          : "rounded-bl-md bg-white text-gray-800"
                      }`}
                    >
                      <p className="break-words">
                        {item.text}
                      </p>
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

      {/* Send Message */}
      <form
        aria-required={true}
        className="border-t border-gray-100 bg-white p-3 sm:p-4"
        onSubmit={sendMessageHandler}
      >
        <div className="flex items-center gap-2">
          {/* Image Upload */}
          <div className="flex-shrink-0">
            <input
              type="file"
              name=""
              id="image"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <label
              htmlFor="image"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900"
            >
              <TfiGallery size={19} />
            </label>
          </div>

          {/* Input */}
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

export default DashboardMessages;
