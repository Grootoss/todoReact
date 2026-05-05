import { useState, useMemo, useEffect } from "react";
import styles from "./App.module.css";
import Header from "./components/Header/Header";
import Navigation from "./components/Navigation/Navigation";
import TodoList from "./components/TodoList/TodoList";
import Button from "./components/UI/Button/Button";
import Popup from "./components/UI/Popup/Popup";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const API_URL = "http://localhost:4000/api";

const App = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMode, setPopupMode] = useState<"add" | "edit">("add");
  const [popupText, setPopupText] = useState("");
  const [currentTodoId, setCurrentTodoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState("all");

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/todos`);
      if (!response.ok) throw new Error("Ошибка загрузки");
      const data: Array<{ id: number; text: string; completed: number }> =
        await response.json();

      const formattedTodos = data.map((todo) => ({
        id: todo.id,
        title: todo.text,
        completed: todo.completed === 1,
      }));

      setTodos(formattedTodos);
      setError(null);
    } catch (err) {
      setError("Не удалось загрузить задачи");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddPopup = () => {
    setPopupMode("add");
    setPopupText("");
    setCurrentTodoId(null);
    setIsPopupOpen(true);
  };

  const openEditPopup = (id: number) => {
    const todoToEdit = todos.find((todo) => todo.id === id);
    if (todoToEdit) {
      setPopupMode("edit");
      setPopupText(todoToEdit.title);
      setCurrentTodoId(id);
      setIsPopupOpen(true);
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setPopupText("");
    setCurrentTodoId(null);
  };

  const addTodo = async (text: string) => {
    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Ошибка создания");
      const newTodo = await response.json();

      const formattedTodo = {
        id: newTodo.id,
        title: newTodo.text,
        completed: newTodo.completed === 1,
      };

      setTodos([...todos, formattedTodo]);
      closePopup();
    } catch (err) {
      setError("Не удалось создать задачу");
      console.error(err);
    }
  };

  const editTodo = async (id: number, newTitle: string) => {
    try {
      const todoToEdit = todos.find((todo) => todo.id === id);
      if (!todoToEdit) return;

      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newTitle,
          completed: todoToEdit.completed ? 1 : 0,
        }),
      });

      if (!response.ok) throw new Error("Ошибка обновления");
      const updatedTodo = await response.json();

      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, title: updatedTodo.text } : todo,
        ),
      );
      closePopup();
    } catch (err) {
      setError("Не удалось обновить задачу");
      console.error(err);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Ошибка удаления");

      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (err) {
      setError("Не удалось удалить задачу");
      console.error(err);
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}/toggle`, {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Ошибка обновления статуса");
      const updatedTodo = await response.json();

      setTodos(
        todos.map((todo) =>
          todo.id === id
            ? { ...todo, completed: updatedTodo.completed === 1 }
            : todo,
        ),
      );
    } catch (err) {
      setError("Не удалось обновить статус");
      console.error(err);
    }
  };

  const handleSearch = (searchString: string) => {
    setSearchQuery(searchString);
  };

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
  };

  const handleSaveTodo = (text: string) => {
    if (popupMode === "add") {
      addTodo(text);
    } else if (popupMode === "edit" && currentTodoId !== null) {
      editTodo(currentTodoId, text);
    }
  };

  const filteredTodos = useMemo(() => {
    let result = todos;

    if (searchQuery.trim()) {
      result = result.filter((todo) =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedValue === "complete") {
      result = result.filter((todo) => todo.completed);
    } else if (selectedValue === "incomplete") {
      result = result.filter((todo) => !todo.completed);
    }

    return result;
  }, [todos, searchQuery, selectedValue]);

  if (loading) {
    return <div className={styles.loading}>Загрузка задач...</div>;
  }

  if (error) {
    return <div className={styles.error}>Ошибка: {error}</div>;
  }

  return (
    <div className="app__wrap">
      <div className={styles.app}>
        <Header />
        <main className={styles.app__main}>
          <Navigation
            onSearch={handleSearch}
            selectedValue={selectedValue}
            onSelectChange={handleSelectChange}
          />
          <TodoList
            todos={filteredTodos}
            onEdit={openEditPopup}
            onDelete={deleteTodo}
            onToggle={toggleTodo}
          />
          <Button variant="add" onClick={openAddPopup} />
        </main>
      </div>
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        onSaveTodo={handleSaveTodo}
        initialText={popupText}
        mode={popupMode}
      />
    </div>
  );
};

export default App;
