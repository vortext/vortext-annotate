(ns spa.routes.auth
  (:use compojure.core)
  (:require [spa.layout :as layout]
            [taoensso.timbre :as timbre]
            [noir.session :as session]
            [noir.response :as resp]
            [noir.validation :as vali]
            [noir.util.crypt :as crypt]
            [spa.db.users :as users]))

(defn valid? [id pass pass1]
  (vali/rule (vali/has-value? id)
             [:id "Username is required"])
  (vali/rule (not (users/get id))
             [:id "Username already taken"])
  (vali/rule (vali/min-length? pass 5)
             [:pass "Password must be at least 5 characters"])
  (vali/rule (= pass pass1)
             [:pass1 "Entered passwords do not match"])
  (not (vali/errors? :id :pass :pass1)))

(defn register [& [id]]
  (layout/render
   "home.html"
   {:page-type "home"
    :id id
    :id-error (vali/on-error :id first)
    :pass-error (vali/on-error :pass first)
    :pass1-error (vali/on-error :pass1 first)}))

(defn handle-registration [id pass pass1]
  (if (valid? id pass pass1)
    (try
      (do
        (users/create! id (crypt/encrypt pass))
        (session/put! :user-id id)
        (resp/redirect "/"))
      (catch Exception ex
        (timbre/error ex)
        (vali/rule false [:id (.getMessage ex)])
        (register)))
    (register id)))

(defn profile []
  (layout/render
   "profile.html"
   {:user (users/get (session/get :user-id))}))

(defn update-profile [{:keys [first-name last-name email]}]
  (users/update! (session/get :user-id) first-name last-name email)
  (profile))

(defn handle-login [id pass]
  (let [user (users/get id)]
    (if (and user (crypt/compare pass (:pass user)))
      (do
        (session/put! :user-id id)
        (resp/redirect "/"))
      (layout/render "home.html"
                     {:page-type "home"
                      :login-error "Invalid username or password"}))))

(defn logout []
  (session/clear!)
  (session/flash-put! :logged-out true)
  (resp/redirect "/"))

(defroutes auth-routes
  (POST "/register" [id pass pass1]
        (handle-registration id pass pass1))

  (GET "/profile" [] (profile))

  (POST "/update-profile" {params :params} (update-profile params))

  (POST "/login" [id pass]
        (handle-login id pass))

  (GET "/logout" []
       (logout)))
