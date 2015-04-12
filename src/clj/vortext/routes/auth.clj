(ns vortext.routes.auth
  (:require [vortext.layout :as layout]
            [taoensso.timbre :as timbre]
            [ring.util.response :refer [response redirect]]
            [compojure.core :refer :all]
            [vortext.security :as security]
            [bouncer.core :as b]
            [bouncer.validators :as v]
            [vortext.db.users :as users]))

(defn not-taken?
  [id]
  (not (users/get id)))

(defn same-as?
  [alpha]
  (fn [beta]
    (= alpha beta)))

(defn valid?
  [user]
  (b/validate user
              :id [[v/required :message "Username is required"]
                   [not-taken? :message "Username already taken"]]
              :pass1 [[v/required :message "Entered passwords must match"]]
              :pass [[v/required :message "Password is required"]
                     [v/min-count 5 :message "Password must be at least 5 characters"]
                     [(same-as? (:pass1 user)) :message "Entered passwords must match"]]))

(defn register
  [validation]
  (layout/render
   "home.html"
   {:page-type "home"
    :validation (first validation)}))

(defn handle-registration
  [request]
  (let [{:keys [id pass pass1]} (:params request)
        user {:id id :pass pass :pass1 pass1}
        validation (valid? user)]
    (if (nil? (first validation))
      (try
        (do
          (users/create! id (security/encrypt pass))
          (->
           (redirect "/")
           (assoc-in [:session :identity] id)))
        (catch Exception ex
          (timbre/error ex)
          (register validation)))
      (register validation))))

(defn profile
  [request]
  (layout/render
   "profile.html"
   {:user (users/get (security/current-user request))}))

(defn update-profile
  [request]
  (let [{:keys [first-name last-name email]} (:params request)]
    (users/update! (security/current-user request) first-name last-name email))
  (profile request))

(defn handle-login
  [request]
  (let [{:keys [id pass]} (:params request)
        user (users/get id)]
    (if (and user (security/compare pass (:pass user)))
      (->
       (redirect "/")
       (assoc-in [:session :identity] id))
      (layout/render "home.html"
                     {:page-type "home"
                      :login-error "Invalid username or password"}))))

(defn logout
  [request]
  (-> (redirect "/")
     (assoc :session {})
     (assoc-in [:flash :logged-out] true)))

(defroutes auth-routes
  (POST "/register" [:as request]
        (handle-registration request))
  (GET "/profile" [:as request]
       (profile request))
  (POST "/update-profile" [:as request]
        (update-profile request))
  (POST "/login" [id pass :as request]
        (handle-login request))
  (GET "/logout" [:as request]
       (logout request)))
