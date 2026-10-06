import axios from "axios";
import React, { useRef, useState } from "react";
import { useEffect } from "react";
import { server } from "../../server";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AiOutlineArrowRight, AiOutlinePlus, AiOutlineSend } from "react-icons/ai";
import styles from "../../styles/styles";
import Ratings from "../Product/Ratings";
import { TfiGallery } from "react-icons/tfi";
import socketId from "../../utils/socket";
import { format } from "timeago.js";
import { toast } from "react-toastify";

const DashboardMessages = () => {
  const { seller,isLoading } = useSelector((state) => state.seller);
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState();
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeStatus, setActiveStatus] = useState(false);
  const [open, setOpen] = useState(false);
  // Ratings the buyer left on the shop from this thread. The shop cannot write
  // one itself, so this is read-only here.
  const [reviews, setReviews] = useState([]);
  // The shop can open a thread first; the picker lists its own customers.
  const [showNewChat, setShowNewChat] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  // Read inside the socket callbacks, which must not be re-registered every time
  // the open thread changes.
  const currentChatRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    socketId.connect();

    // Both live handlers read the open thread through `currentChatRef` and
    // write state directly. Routing them through a state-then-effect chain would
    // re-run the effect on every unrelated render and drop messages for the
    // other threads this tab is not showing.
    const belongsToOpenThread = (senderId, conversationId) => {
      const chat = currentChatRef.current;

      if (!chat?._id) return false;
      if (!chat.members.includes(senderId)) return false;

      return !conversationId || conversationId === chat._id;
    };

    const onMessage = (data) => {
      if (!belongsToOpenThread(data.senderId, data.conversationId)) return;

      setMessages((prev) => [
        ...prev,
        {
          sender: data.senderId,
          text: data.text,
          images: data.images,
          conversationId: data.conversationId,
          createdAt: Date.now(),
        },
      ]);
    };

    socketId.on("getMessage", onMessage);

    // A buyer can change their rating, so the newest event replaces the older
    // one for the same buyer instead of stacking a second card.
    const onShopReview = (data) => {
      if (!data?.review) return;
      if (data.conversationId !== currentChatRef.current?._id) return;

      setReviews((prev) => [
        data.review,
        ...prev.filter(
          (review) => String(review.user) !== String(data.review.user)
        ),
      ]);
    };

    socketId.on("getShopReview", onShopReview);

    return () => {
      socketId.off("getMessage", onMessage);
      socketId.off("getShopReview", onShopReview);
      socketId.disconnect();
    };
  }, []);

  // Kept in a ref so the socket callbacks above can read the open thread
  // without being re-registered whenever it changes.
  useEffect(() => {
    currentChatRef.current = currentChat ?? null;
  }, [currentChat]);

  // get the ratings for the open thread
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

  // Buyers of this shop, fetched while the picker is open so the list is never
  // held in state for a session in which it is never shown.
  useEffect(() => {
    if (!showNewChat) return;

    let cancelled = false;

    const getCustomers = async () => {
      setCustomersLoading(true);

      try {
        const response = await axios.get(
          `${server}/order/get-customers-of-shop`,
          { withCredentials: true }
        );

        if (!cancelled) setCustomers(response.data.customers || []);
      } catch {
        if (!cancelled) setCustomers([]);
      } finally {
        if (!cancelled) setCustomersLoading(false);
      }
    };

    getCustomers();

    return () => {
      cancelled = true;
    };
  }, [showNewChat]);

  // Opens (or reuses) the thread with the chosen buyer and jumps straight into
  // it, the same way clicking a row in the list does.
  const startChatWith = async (customer) => {
    try {
      const response = await axios.post(
        `${server}/conversation/start-conversation-seller`,
        { userId: customer._id },
        { withCredentials: true }
      );

      const conversation = response.data?.conversation;

      if (!conversation?._id) return;

      setConversations((prev) =>
        prev.some((item) => item._id === conversation._id)
          ? prev
          : [conversation, ...prev]
      );
      setCurrentChat(conversation);
      setUserData(customer);
      setActiveStatus(
        onlineUsers.some((user) => user.userId === customer._id)
      );
      setMessages([]);
      setNewMessage("");
      setCustomerSearch("");
      setShowNewChat(false);
      setOpen(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not start the conversation"
      );
    }
  };

  useEffect(() => {
    const getConversation = async () => {
      try {
        const resonse = await axios.get(
          `${server}/conversation/get-all-conversation-seller/${seller?._id}`,
          {
            withCredentials: true,
          }
        );

        setConversations(resonse.data.conversations);
      } catch {
        // The list simply stays as it is: there is nothing useful to show here.
      }
    };
    getConversation();
  }, [seller, messages]);

  useEffect(() => {
    if (seller) {
      const sellerId = seller?._id;
      socketId.emit("addUser", sellerId);

      const onUsers = (data) => {
        setOnlineUsers(Array.isArray(data) ? data : []);
      };

      socketId.on("getUsers", onUsers);

      return () => {
        socketId.off("getUsers", onUsers);
      };
    }
  }, [seller]);

  const onlineCheck = (chat) => {
    const chatMembers = chat.members.find((member) => member !== seller?._id);
    const online = onlineUsers.find((user) => user.userId === chatMembers);

    return online ? true : false;
  };

  // get messages
  useEffect(() => {
    // currentChat is undefined until a thread is opened, so requesting here
    // would hit /get-all-messages/undefined.
    if (!currentChat?._id) return;

    let cancelled = false;

    const getMessage = async () => {
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

  // create new message
  const sendMessageHandler = async (e) => {
    e.preventDefault();

    const message = {
      sender: seller._id,
      text: newMessage,
      conversationId: currentChat._id,
    };

    // `members` holds bare id strings, so `member.id` was always undefined and
    // the comparison never matched: the shop used to emit to itself.
    const receiverId = currentChat.members.find(
      (member) => member !== seller._id
    );

    socketId.emit("sendMessage", {
      senderId: seller._id,
      receiverId,
      text: newMessage,
      conversationId: currentChat._id,
    });

    try {
      if (newMessage !== "") {
        await axios
          .post(`${server}/message/create-new-message`, message)
          .then((res) => {
            setMessages([...messages, res.data.message]);
            updateLastMessage();
          })
          .catch((error) => {
            console.log(error);
          });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateLastMessage = async () => {
    socketId.emit("updateLastMessage", {
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

  const handleImageUpload = async (e) => {
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

  const imageSendingHandler = async (e) => {
    const receiverId = currentChat.members.find(
      (member) => member !== seller._id
    );

    socketId.emit("sendMessage", {
      senderId: seller._id,
      receiverId,
      images: e,
      conversationId: currentChat._id,
    });

    try {
      await axios
        .post(`${server}/message/create-new-message`, {
          images: e,
          sender: seller._id,
          text: newMessage,
          conversationId: currentChat._id,
        })
        .then((res) => {
          setMessages([...messages, res.data.message]);
          updateLastMessageForImage();
        });
    } catch (error) {
      console.log(error);
    }
  };

  const updateLastMessageForImage = async () => {
    await axios.put(
      `${server}/conversation/update-last-message/${currentChat._id}`,
      {
        lastMessage: "Photo",
        lastMessageId: seller._id,
      }
    );
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ beahaviour: "smooth" });
  }, [messages]);

  return (
    <div className="w-[90%] bg-white m-5 h-[85vh] overflow-y-scroll rounded">
      {!open && (
        <>
          <div className="flex items-center justify-between px-3 pt-3">
            <h1 className="text-[24px] 800px:text-[30px] font-Poppins pl-2">
              All Messages
            </h1>
            <button
              type="button"
              onClick={() => setShowNewChat(true)}
              className="flex items-center gap-1 bg-black text-white rounded-[5px] px-3 py-2 text-[14px] hover:bg-[#333]"
            >
              <AiOutlinePlus size={16} />
              New chat
            </button>
          </div>

          {/* All messages list */}
          {conversations?.length === 0 && (
            <p className="text-center text-[15px] text-[#0009] py-6 px-3">
              No conversations yet. Start one with &quot;New chat&quot;.
            </p>
          )}

          {conversations &&
            conversations.map((item, index) => (
              <MessageList
                data={item}
                key={index}
                index={index}
                setOpen={setOpen}
                setCurrentChat={setCurrentChat}
                me={seller._id}
                setUserData={setUserData}
                userData={userData}
                online={onlineCheck(item)}
                setActiveStatus={setActiveStatus}
                isLoading={isLoading}
              />
            ))}
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
          reviews={reviews}
          conversationId={currentChat?._id}
        />
      )}

      {showNewChat && (
        <NewChatPicker
          loading={customersLoading}
          customers={customers}
          search={customerSearch}
          onSearch={setCustomerSearch}
          onClose={() => setShowNewChat(false)}
          onPick={startChatWith}
        />
      )}
    </div>
  );
};

// Buyer picker for a thread the shop opens itself. Only buyers who ordered from
// this shop are offered: they are the people this inbox is about, and without
// that list the shop would have no way to know who it can write to.
const NewChatPicker = ({
  loading,
  customers,
  search,
  onSearch,
  onClose,
  onPick,
}) => {
  const keyword = search.trim().toLowerCase();

  const filtered = keyword
    ? customers.filter((customer) =>
        `${customer.name || ""} ${customer.email || ""}`
          .toLowerCase()
          .includes(keyword)
      )
    : customers;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-white rounded-[10px] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-200">
          <h2 className="text-[18px] font-[600]">New conversation</h2>
          <AiOutlineArrowRight
            size={20}
            className="cursor-pointer"
            onClick={onClose}
          />
        </div>

        <div className="p-3">
          <input
            type="text"
            autoFocus
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className={styles.input}
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-3 pb-3">
          {loading && (
            <p className="text-[14px] text-[#0009] py-3">Loading...</p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-[14px] text-[#0009] py-3">
              {customers.length
                ? "No customer matches your search."
                : "No customers yet. Buyers appear here once they have ordered from this shop."}
            </p>
          )}

          {!loading &&
            filtered.map((customer) => (
              <div
                key={customer._id}
                className="flex items-center justify-between p-3 rounded-[10px] hover:bg-[#00000010] cursor-pointer"
                onClick={() => onPick(customer)}
              >
                <div className="flex items-center">
                  {customer.avatar?.url ? (
                    <img
                      src={customer.avatar.url}
                      alt=""
                      className="w-[45px] h-[45px] rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-[45px] h-[45px] rounded-full bg-[#38c776] text-white flex items-center justify-center text-[18px]">
                      {(customer.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="pl-3">
                    <h1 className="text-[16px]">{customer.name}</h1>
                    <p className="text-[13px] text-[#000c]">
                      {customer.email}
                    </p>
                  </div>
                </div>
                <span className="text-[12px] text-[#0009] shrink-0 pl-2">
                  {customer.orders}{" "}
                  {customer.orders === 1 ? "order" : "orders"}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const MessageList = ({
  data,
  index,
  setOpen,
  setCurrentChat,
  me,
  setUserData,
  online,
  setActiveStatus,
  isLoading
}) => {
  console.log(data);
  const [user, setUser] = useState([]);
  const navigate = useNavigate();
  const handleClick = (id) => {
    navigate(`/dashboard-messages?${id}`);
    setOpen(true);
  };
  const [active, setActive] = useState(0);

  useEffect(() => {
    const userId = data?.members?.find((member) => member !== me);
    if (!userId) return;

    const getUser = async () => {
      try {
        const res = await axios.get(`${server}/user/user-info/${userId}`);
        setUser(res.data.user);
      } catch (error) {
        console.log(error);
      }
    };
    getUser();
  }, [me, data]);

  return (
    <div
      className={`w-full flex p-3 px-3 ${
        active === index ? "bg-[#00000010]" : "bg-transparent"
      }  cursor-pointer`}
      onClick={() =>
        setActive(index) ||
        handleClick(data._id) ||
        setCurrentChat(data) ||
        setUserData(user) ||
        setActiveStatus(online)
      }
    >
      <div className="relative">
        <img
          src={`${user?.avatar?.url}`}
          alt=""
          className="w-[50px] h-[50px] rounded-full"
        />
        {online ? (
          <div className="w-[12px] h-[12px] bg-green-400 rounded-full absolute top-[2px] right-[2px]" />
        ) : (
          <div className="w-[12px] h-[12px] bg-[#c7b9b9] rounded-full absolute top-[2px] right-[2px]" />
        )}
      </div>
      <div className="pl-3">
        <h1 className="text-[18px]">{user?.name}</h1>
        <p className="text-[16px] text-[#000c]">
          {!isLoading && data?.lastMessageId !== user?._id
            ? "You:"
            : (user?.name || "").split(" ")[0] + ": "}{" "}
          {data?.lastMessage}
        </p>
      </div>
    </div>
  );
};

// Read-only view of what the buyer rated the shop, rendered inside the thread.
// The rating is written by the buyer from their own inbox, so the shop only
// gets to see it here.
const SellerReviewList = ({ reviews, conversationId, userData }) => {
  // Ratings belong to one thread, and switching threads refetches rather than
  // clearing, so anything still tagged with the previous thread is filtered out
  // here instead of being shown against the wrong buyer.
  const shown = reviews.filter(
    (review) => String(review.conversationId) === String(conversationId)
  );

  if (shown.length === 0) return null;

  return (
    <div className="w-full px-3 pt-3">
      <div className="rounded-[10px] border border-amber-100 bg-amber-50 p-3">
        <h2 className="text-[14px] font-[600] text-amber-900 mb-2">
          Rating from {userData?.name}
        </h2>

        {shown.map((review) => (
          <div key={review._id} className="border-b border-amber-100 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
            <Ratings rating={review.rating} />
            {review.comment && (
              <p className="text-[13px] text-amber-900 pt-1 break-words">
                {review.comment}
              </p>
            )}
            <p className="text-[11px] text-amber-700/80 pt-1">
              {format(review.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  reviews,
  conversationId,
}) => {
  return (
    <div className="w-full min-h-full flex flex-col justify-between">
      {/* message header */}
      <div className="w-full flex p-3 items-center justify-between bg-slate-200">
        <div className="flex">
          <img
            src={`${userData?.avatar?.url}`}
            alt=""
            className="w-[60px] h-[60px] rounded-full"
          />
          <div className="pl-3">
            <h1 className="text-[18px] font-[600]">{userData?.name}</h1>
            <h1>{activeStatus ? "Active Now" : ""}</h1>
          </div>
        </div>
        <AiOutlineArrowRight
          size={20}
          className="cursor-pointer"
          onClick={() => setOpen(false)}
        />
      </div>

      {/* ratings the buyer left on this shop */}
      <SellerReviewList
        reviews={reviews}
        conversationId={conversationId}
        userData={userData}
      />

      {/* messages */}
      <div className="px-3 h-[65vh] py-3 overflow-y-scroll">
        {messages &&
          messages.map((item, index) => {
            return (
              <div
                key={item._id || item.id || `${item.createdAt}-${index}`}
                className={`flex w-full my-2 ${
                  item.sender === sellerId ? "justify-end" : "justify-start"
                }`}
                ref={scrollRef}
              >
                {item.sender !== sellerId && (
                  <img
                    src={`${userData?.avatar?.url}`}
                    className="w-[40px] h-[40px] rounded-full mr-3"
                    alt=""
                  />
                )}
                {item.images && (
                  <img
                    src={`${item.images?.url}`}
                    className="w-[300px] h-[300px] object-cover rounded-[10px] mr-2"
                  />
                )}
                {item.text !== "" && (
                  <div>
                    <div
                      className={`w-max p-2 rounded ${
                        item.sender === sellerId ? "bg-[#000]" : "bg-[#38c776]"
                      } text-[#fff] h-min`}
                    >
                      <p>{item.text}</p>
                    </div>

                    <p className="text-[12px] text-[#000000d3] pt-1">
                      {format(item.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* send message input */}
      <form
        aria-required={true}
        className="p-3 relative w-full flex justify-between items-center"
        onSubmit={sendMessageHandler}
      >
        <div className="w-[30px]">
          <input
            type="file"
            name=""
            id="image"
            className="hidden"
            onChange={handleImageUpload}
          />
          <label htmlFor="image">
            <TfiGallery className="cursor-pointer" size={20} />
          </label>
        </div>
        <div className="w-full">
          <input
            type="text"
            required
            placeholder="Enter your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className={`${styles.input}`}
          />
          <input type="submit" value="Send" className="hidden" id="send" />
          <label htmlFor="send">
            <AiOutlineSend
              size={20}
              className="absolute right-4 top-5 cursor-pointer"
            />
          </label>
        </div>
      </form>
    </div>
    );
};

export default DashboardMessages;