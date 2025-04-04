import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Truck, Users } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, setLocation] = useLocation();

  if (user) {
    setLocation("/");
    return null;
  }

  const form = useForm({
    
    defaultValues: {
      username: "",
      password: "",
      email: "",
      first_name: "",
      last_name: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
     console.log("Form Data: ", isLogin); 
    if (isLogin) {
      loginMutation.mutate(data);
    } else {
      registerMutation.mutate(data);
    }
  });

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Welcome back! Login to continue."
                : "Create an account to get started."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4">

                {/* Registration fields (only when registering) */}
                {!isLogin && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Username and Password (always visible) */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                >
                  {isLogin ? "Login" : "Register"}
                </Button>
              </form>
            </Form>

            {/* Toggle Button */}
            <Button
              variant="link"
              className="mt-4 w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Need an account?" : "Already have an account?"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Section */}
<div className="hidden md:flex flex-col justify-center p-8 bg-primary text-primary-foreground">
  <div className="max-w-md mx-auto space-y-6">
    <h1 className="text-4xl font-bold">Trip Tracking & ELD Platform</h1>
    <p className="text-lg opacity-90">
      Manage your electronic logging device (ELD) records and visualize trip routes with real-time map tracking.
    </p>
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Truck className="h-8 w-8" />
        <div>
        <h3 className="font-semibold">Live Trip Mapping</h3>
          <p className="opacity-90">
            Visualize trip routes on interactive maps for better planning and monitoring.
          </p>
          
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8" />
        <div>
          <h3 className="font-semibold">Automated ELD Logs</h3>
          <p className="opacity-90">
            Automatically track hours of service and log compliance records for every trip.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>


    </div>
  );
}
