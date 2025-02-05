"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import Image from "next/image";

// アイコンを追加するためにHeroiconsのコンポーネントを追加
function TodoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function ShoppingIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

// 背景用のペット画像コンポーネントを修正
function BackgroundPets() {
  // ランダムな位置を生成する関数
  const getRandomPosition = () => {
    const margin = 15; // 画面端からの最小距離（%）
    return {
      top: `${margin + Math.random() * (100 - 2 * margin)}%`,
      left: `${margin + Math.random() * (100 - 2 * margin)}%`,
      rotation: `${Math.random() * 40 - 20}deg`, // -20度から+20度
    };
  };

  // 各ペットの初期位置を設定
  const pets = [
    {
      id: 1,
      image: "/mini.png",
      size: 40,
      ...getRandomPosition(),
      delay: "0s"
    },
    {
      id: 2,
      image: "/tora.png",
      size: 40,
      ...getRandomPosition(),
      delay: "2s"
    }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {pets.map((pet) => (
        <div
          key={pet.id}
          className="absolute animate-float"
          style={{
            top: pet.top,
            left: pet.left,
            transform: `rotate(${pet.rotation})`,
            animationDelay: pet.delay,
          }}
        >
          <div className="relative duration-300">
            <Image
              src={pet.image}
              alt="ペット"
              width={pet.size}
              height={pet.size}
              className="rounded-full object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [newItem, setNewItem] = useState("");
  const [activeTab, setActiveTab] = useState("todo");
  const [activeUser, setActiveUser] = useState("たら");

  useEffect(() => {
    let unsubTodos;
    let unsubItems;

    const setupSubscriptions = async () => {
      try {
        unsubTodos = onSnapshot(collection(db, "todos"), (snapshot) => {
          const todosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()
          }));
          setTodos(todosData);
        }, (error) => {
          console.error("Todos subscription error:", error);
        });

        unsubItems = onSnapshot(collection(db, "shopping"), (snapshot) => {
          const itemsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()
          }));
          setShoppingItems(itemsData);
        }, (error) => {
          console.error("Shopping items subscription error:", error);
        });
      } catch (error) {
        console.error("Error setting up subscriptions:", error);
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubTodos) unsubTodos();
      if (unsubItems) unsubItems();
    };
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    const todoText = newTodo.trim();
    if (!todoText) return;

    try {
      // Firestoreの接続確認
      if (!db) {
        throw new Error("Firestore connection not established");
      }

      const docRef = await addDoc(collection(db, "todos"), {
        text: todoText,
        completed: false,
        createdAt: new Date().toISOString(),
        addedBy: activeUser
      });

      if (docRef.id) {
        setNewTodo("");
        console.log("Todo added successfully with ID:", docRef.id);
      }
    } catch (error) {
      console.error("Error adding todo:", error.message, error.code);
      alert(`タスクの追加に失敗しました: ${error.message}`);
    }
  };

  const addShoppingItem = async (e) => {
    e.preventDefault();
    const itemText = newItem.trim();
    if (!itemText) return;

    try {
      // Firestoreの接続確認
      if (!db) {
        throw new Error("Firestore connection not established");
      }

      const docRef = await addDoc(collection(db, "shopping"), {
        name: itemText,
        purchased: false,
        createdAt: new Date().toISOString(),
        addedBy: activeUser
      });

      if (docRef.id) {
        setNewItem("");
        console.log("Shopping item added successfully with ID:", docRef.id);
      }
    } catch (error) {
      console.error("Error adding shopping item:", error.message, error.code);
      alert(`アイテムの追加に失敗しました: ${error.message}`);
    }
  };

  const toggleTodo = async (id, completed) => {
    await updateDoc(doc(db, "todos", id), { completed: !completed });
  };

  const toggleItem = async (id, purchased) => {
    await updateDoc(doc(db, "shopping", id), { purchased: !purchased });
  };

  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, "todos", id));
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "shopping", id));
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-blue-100 via-pink-50 to-blue-50 dark:from-blue-950 dark:via-pink-900 dark:to-blue-900 relative overflow-hidden">
      {/* 背景のペット画像を追加 */}
      <BackgroundPets />

      <div className="max-w-2xl mx-auto space-y-6 relative z-0">
        {/* タイトルを追加 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">
            するかうじょ！
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>with</span>
            <div className="flex -space-x-2">
              <div className="relative w-6 h-6">
                <Image
                  src="/mini.png"
                  alt="ミニちゃん"
                  width={24}
                  height={24}
                  className="rounded-full object-cover border-2 border-white"
                />
              </div>
              <div className="relative w-6 h-6">
                <Image
                  src="/tora.png"
                  alt="トラちゃん"
                  width={24}
                  height={24}
                  className="rounded-full object-cover border-2 border-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 bg-white/80 dark:bg-gray-800/80 p-4 rounded-xl shadow-lg backdrop-blur-sm">
          <button
            onClick={() => setActiveUser("たら")}
            className={`flex-1 py-3 px-6 rounded-lg transition-all transform hover:scale-105 ${
              activeUser === "たら"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/tara.png"
                  alt="たら"
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                  priority
                />
              </div>
              <span>たら</span>
            </div>
          </button>
          <button
            onClick={() => setActiveUser("ぬた")}
            className={`flex-1 py-3 px-6 rounded-lg transition-all transform hover:scale-105 ${
              activeUser === "ぬた"
                ? "bg-pink-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/nuta.png"
                  alt="ぬた"
                  width={26}
                  height={26}
                  className="rounded-full object-cover"
                  priority
                />
              </div>
              <span>ぬた</span>
            </div>
          </button>
        </div>

        <div className="flex gap-4 bg-white/80 dark:bg-gray-800/80 p-4 rounded-xl shadow-lg backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("todo")}
            className={`flex-1 py-3 px-6 rounded-lg transition-all transform hover:scale-105 ${
              activeTab === "todo"
                ? "bg-indigo-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TodoIcon />
              <span>するじょ</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("shopping")}
            className={`flex-1 py-3 px-6 rounded-lg transition-all transform hover:scale-105 ${
              activeTab === "shopping"
                ? "bg-emerald-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShoppingIcon />
              <span>買うじょ</span>
            </div>
          </button>
        </div>

        {activeTab === "todo" && (
          <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-xl shadow-lg backdrop-blur-sm border-t-4 border-indigo-500">
            <div className="flex items-center gap-3 mb-6">
              <TodoIcon />
              <h2 className="text-2xl font-bold">するじょ</h2>
            </div>
            <form onSubmit={addTodo} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="flex-1 p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={`${activeUser}のタスクを入力じょ`}
                />
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-lg text-white transition-all transform hover:scale-105 ${
                    activeUser === "たら" ? "bg-blue-500 hover:bg-blue-600" : "bg-pink-500 hover:bg-pink-600"
                  }`}
                >
                  追加
                </button>
              </div>
            </form>
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <span className={todo.completed ? "line-through text-gray-500" : ""}>
                      {`${todo.text} じょ`}
                    </span>
                    <span className={`ml-2 text-sm font-medium flex items-center gap-1 ${
                      todo.addedBy === "たら" ? "text-blue-500" : "text-pink-500"
                    }`}>
                      <div className="relative w-4 h-4">
                        <Image
                          src={todo.addedBy === "たら" ? "/tara.png" : "/nuta.png"}
                          alt={todo.addedBy}
                          width={16}
                          height={16}
                          className="rounded-full object-cover"
                        />
                      </div>
                      ({todo.addedBy})
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 group transition-all duration-200"
                    aria-label="削除"
                  >
                    <span className="flex items-center gap-2 text-red-500 group-hover:text-red-600">
                      <TrashIcon />
                      <span className="text-sm font-medium">
                        削除
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "shopping" && (
          <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-xl shadow-lg backdrop-blur-sm border-t-4 border-emerald-500">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingIcon />
              <h2 className="text-2xl font-bold">買うじょ</h2>
            </div>
            <form onSubmit={addShoppingItem} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="flex-1 p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={`${activeUser}の買い物を入力じょ`}
                />
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-lg text-white transition-all transform hover:scale-105 ${
                    activeUser === "たら" ? "bg-blue-500 hover:bg-blue-600" : "bg-pink-500 hover:bg-pink-600"
                  }`}
                >
                  追加
                </button>
              </div>
            </form>
            <ul className="space-y-3">
              {shoppingItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    checked={item.purchased}
                    onChange={() => toggleItem(item.id, item.purchased)}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <span className={item.purchased ? "line-through text-gray-500" : ""}>
                      {`${item.name} じょ`}
                    </span>
                    <span className={`ml-2 text-sm font-medium flex items-center gap-1 ${
                      item.addedBy === "たら" ? "text-blue-500" : "text-pink-500"
                    }`}>
                      <div className="relative w-4 h-4">
                        <Image
                          src={item.addedBy === "たら" ? "/tara.png" : "/nuta.png"}
                          alt={item.addedBy}
                          width={16}
                          height={16}
                          className="rounded-full object-cover"
                        />
                      </div>
                      ({item.addedBy})
                    </span>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 group transition-all duration-200"
                    aria-label="削除"
                  >
                    <span className="flex items-center gap-2 text-red-500 group-hover:text-red-600">
                      <TrashIcon />
                      <span className="text-sm font-medium">
                        削除
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
